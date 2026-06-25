# Kaoto camel-catalog: 403 в prod-сборке ecos-ui

> **✅ Исправлено (2026-04-29), коммит `024337b2e`.** Дефолт `catalogUrl` изменён на `/camel-catalog/index.json` (`KaotoModeler.jsx:56`). Тот же коммит чинит два сопутствующих layout-бага прода: схлопывание высоты канваса (collapsed height) и переполнение страницы (page overflow). Документ — root-cause reference.

Связано: эпик COREDEV-208, story COREDEV-209. Проблема **post-MVP** — выявлена при первом prod-deploy ecos-ui с фичей Kaoto-редактора (2026-04-28), полностью блокирует визуальный канвас в проде. В dev-режиме (`yarn dev`) — не воспроизводится.

## Симптом

При открытии `/v2/camel-dsl-editor?recordRef=...` после `yarn build` + `docker cp build/. citeck_proxy_<ns>_default:/var/www/assets/` канвас Kaoto показывает баннер «The catalog couldn't be loaded — Some catalog library files might not be available». Хедер редактора, recordRef-загрузка, переключатель режимов и Save — работают штатно. Network: `GET http://localhost/camel-catalog/ → 403 Forbidden` (от openresty/nginx). Конкретные файлы внутри директории отдаются как 200 (`/camel-catalog/index.json` → 200, `/camel-catalog/camel-main/.../aggregate-components-*.json` → 200).

## Root cause

Kaoto при инициализации `RouteVisualization` фетчит `<catalogUrl>` (default `/camel-catalog/`, см. `src/components/ModelEditor/KaotoModeler/KaotoModeler.jsx:54`) **без явного имени файла** — ожидает, что сервер вернёт `index.json` по запросу директории.

В **dev**-режиме это вытягивает наш `serveCamelCatalogPlugin` (`vite.config.js:304-323`):

```js
const catalogMiddleware = (req, res, next) => {
  let url = (req.url || '/').replace(/\?.*$/, '');
  if (url === '' || url === '/' || url.endsWith('/')) {
    url = path.posix.join(url, 'index.json');   // ← автодобавление
  }
  ...
};
```

В **prod**-режиме `writeBundle` плагина копирует каталог в `build/camel-catalog/` (`vite.config.js:334-371`) — статика, без middleware. Раздачей занимается openresty в `citeck_proxy_<ns>_default`, у которого в дефолтном nginx-конфиге **нет** `index index.json;` для этой директории, и directory-listing выключен → запрос `/camel-catalog/` возвращает 403.

## Объём поломки

- Любой переход в `CamelDslEditor` в prod — канвас не рисуется. Edit-mode из журнала через action `open-camel-dsl-editor` (см. [kaoto-mvp-finalization.md §«Связь в трекере»](./kaoto-mvp-finalization.md)) — воспроизводимо.
- Side-кнопки редактора (Save, переключатель режимов, recordRef-load) — работают, потому что не зависят от каталога. YAML-only режим (`?viewMode=yaml`) теоретически тоже работает, не проверено.
- Acceptance MVP §1–§5 (см. план финализации) проводился **в dev-режиме** через `yarn dev` — поэтому проблема не всплыла раньше.

## Решение: явное имя файла в `catalogUrl`

Меняем дефолт `catalogUrl` в `KaotoModeler.jsx:54` с `/camel-catalog/` на `/camel-catalog/index.json`. Один-line PR, без правок в proxy/инфраструктуре.

**Почему это безопасно для sub-resource'ов** — вычисление `basePath` в Kaoto:

```js
// node_modules/@kaoto/kaoto/lib/esm/providers/runtime.provider.js:25
const basePath = props.catalogUrl.substring(0, props.catalogUrl.lastIndexOf('/'));
```

Sub-resource'ы (`schemas.provider.js:24`, `dynamic-catalog/catalog.provider.js:24`):

```js
const indexFile = `${basePath}/${selectedCatalogIndexFile}`;
```

Оба варианта — `'/camel-catalog/'` и `'/camel-catalog/index.json'` — дают идентичный `basePath = '/camel-catalog'`. Меняется только первый fetch (с 403 на 200), все sub-resource'ы запрашиваются по тем же путям, что и раньше.

Дополнительно: существующий тест `RouteVisualizationWithCatalog.test.js:142` уже использует форму `'http://localhost/camel-catalog/index.json'` — то есть форма с явным файлом проверена в репо.

Регрессия: `__tests__/catalogUrlDefault.test.js` — статическая проверка дефолта, чтобы случайно не вернуться к директорному URL.

## Acceptance

1. После `yarn build` + `docker cp build/. citeck_proxy_<ns>_default:/var/www/assets/`:
   - `curl -I http://localhost/camel-catalog/index.json` → 200.
   - Открытие `/v2/camel-dsl-editor?recordRef=integrations/camel-dsl@<id>&ws=admin$workspace` → канвас Kaoto рисует ноды маршрута без баннера ошибки.
2. Network tab: ноль 403/404 на `/camel-catalog/*`.
3. Сценарий `?new=true` тоже работает (создание route с триггером, см. [kaoto-mvp-finalization.md §5](./kaoto-mvp-finalization.md)).
4. Console: ноль новых error'ов по сравнению с dev-режимом.
5. Проверено в `yarn dev` (не сломали dev-flow) и в prod-deploy (фикс выполняет свою задачу).

> Замечание: `yarn preview` баг **не воспроизводит** — `configurePreviewServer` подключает тот же `catalogMiddleware` (vite.config.js:331-333). Проверять только через `docker cp` в openresty.

> Замечание: `index.json` после фикса фетчится напрямую — проверить заголовки `Cache-Control`/`ETag` openresty, чтобы после релиза с обновлённым каталогом не получить stale-fetch у пользователей с открытой вкладкой. Если кэш агрессивный — можно версионировать запрос (`?v=<build-hash>`).

## Out of scope

- Любые изменения функциональности самого редактора — только catalog-loading в prod.
- Перевод на iframe-embedding через `multiplying-architecture` / `KaotoEditorFactory` — отдельная стратегическая задача, см. [kaoto-integration-plan.md §8 п.8](../kaoto-integration-plan.md). Решает ту же проблему «по-крупному» (catalogURL резолвится самим Kaoto-iframe'ом из своего bundle'а), но 5–10 дней работы — для bugfix'а избыточно.
- Патч nginx-конфига `citeck_proxy_<ns>_default` (директива `index index.json;`) — чистое инфра-решение, но требует координации с командой proxy-image и переживёт пересоздание контейнера только если попадёт в сам образ. Не нужен, раз one-liner в коде закрывает кейс.
- Оптимизация размера каталога в prod-сборке (текущий `~30 МБ` после allowlist-фильтра — допустимо для админского UI, не блокирует). Стоит проверить, что openresty отдаёт его с gzip — иначе +2-3 секунды на холодный старт.
