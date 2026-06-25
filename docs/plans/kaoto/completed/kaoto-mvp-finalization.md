# Kaoto MVP: финализация property-форм и стартовая палитра

> **Статус 2026-04-29:** §3 (наша палитра, `AddStepButton`/`AddStepModal`/`addStepTiles`) откачен — см. [kaoto-palette-consolidation.md](./kaoto-palette-consolidation.md) и план реализации [`2026-04-28-kaoto-palette-consolidation-impl.md`](./2026-04-28-kaoto-palette-consolidation-impl.md). Палитру заменил единый нативный Kaoto «+ Add step» на ноде, обогащённый preset'ом тега `citeck` и расширенным catalog-overrides (8 core + 12 addons схем). §1 и §2 этого плана остаются в силе как закрытый MVP.

Контекст: см. [kaoto-integration-plan.md](../kaoto-integration-plan.md) §-0.4 (catalog schema resolver сделан 2026-04-28), §3.0.3 (Catalog extension, был research-stub), §384, §733.

Цель плана — закрыть два архитектурных хвоста, оставшихся в `KaotoModeler` после Patch A и -0.4:

1. **Снять дублирование property-форм** (наш `StepForm`/`StepPicker` vs встроенный Kaoto `CanvasSideBar`). Уйти на одну форму — нативный `CanvasSideBar`.
2. **Поднять стартовую палитру компонентов** (Add Step) — собственный toolbar/modal на базе публичного Kaoto `Catalog` + наш YAML-mutation handler через контракт `RouteVisualization` (`code`/`codeChange`). Embeddable palette-sidebar и programmatic step-API в Kaoto **не предоставляются как публичный поддерживаемый surface**: команда экспортирует `RouteVisualization` в `@kaoto/kaoto/components`, но не документирует и не использует его сама — в VS Code extension они идут через [`multiplying-architecture` / `KaotoEditorFactory`](https://github.com/KaotoIO/vscode-kaoto/blob/main/src/webview/KaotoEditorEnvelopeApp.ts) (iframe + KIE Tooling). Так что для нашего React-component embedding'а — только YAML-round-trip.

Объём: **~5.5–6 рабочих дней**. Делается в рамках этапа 2 основного плана.

## Исходные факты

- В 2.9.0 (наша pinned) и в 2.11.0-RC1 (последняя на npm) — публичный `public-api.d.ts` идентичен. Палитры не появилось и не появится в ближайших патчах.
- `CanvasSideBar` Kaoto после Patch A работает (план §378): клик на ноду → форма свойств с табами Required/All/Modified, рендерит `KaotoForm` из `@kaoto/forms` поверх данных Kaoto'вского каталога (`/camel-catalog/`).
- Наши Citeck-overrides (`ecos-event`, `ecos-endpoint`) сейчас живут **только** в `citeckSchemas.js` и подсасываются нашим `catalogResolver.js` → `StepForm.jsx`. CanvasSideBar их **не видит** — у него свой lookup по сырым `/camel-catalog/`-данным. Дополнительно в `citeckSchemas.js` есть override на step type `bean` (для `bean:ecos-secret/<id>`), но он ошибочный: `ecos-secret` — это Camel `PropertiesFunction` (`ecos-camel-core/EcosSecretPropertiesFunction.kt`), используется как `{{ecos-secret:<id>/<field>}}` в параметрах других шагов, а не как DSL-нода `bean`. Этот override никогда не срабатывал по назначению и в §2 уйдёт вместе с файлом как тех-долг.
- Дублирование двух форм означает: после клика на канвас и в `StepPicker` пользователь редактирует один и тот же шаг через два разных UI с разной семантикой и без синхронизации. Это самый видимый UX-дефект.

## Архитектурный итог (то, к чему идём)

```
KaotoModeler
├── canvas (RouteVisualization) — занимает всю левую часть, как у Kaoto
│   ├── ContextToolbar (родной) + наш AddStep-button → AddStepModal
│   └── CanvasSideBar (родной) — единственная форма свойств
└── Monaco YAML pane — справа, переключатель «Visual / Split / YAML» (дефолт `Visual`, см. §2.1)
```

Удаляются: `StepPicker.jsx`, `StepForm.jsx`, `catalogResolver.js`, `citeckSchemas.js` (содержимое мигрирует в формат каталога). Schema lookup полностью на стороне Kaoto, мы только дополняем сам каталог.

## §1. Spike §3.0.3 — перенос Citeck-overrides в Camel-каталог (1 день)

Самостоятельная и наименее обратимая часть — её делаем первой. Если spike развалится — план откатываем, оставляем `StepForm` ровно для трёх типов и не трогаем `StepPicker` до апгрейда Kaoto.

> **Note:** research формата каталога и mechanism injection уже выполнены (2026-04-28, см. секцию ниже). Бюджет 1 день — на саму имплементацию (~3–4 часа на overrides-файл + plugin merge, ~3–4 часа на проверку acceptance в браузере с обоими сценариями `from:`/`to:`).

### Формат каталога и mechanism injection (research выполнен 2026-04-28)

**Catalog tree** в `@kaoto/camel-catalog` 4.14.2:
```
camel-main/4.14.2.redhat-00011/
├── index-<hash>.json                                   ← version index, перечисляет файлы
├── camel-catalog-aggregate-components-<hash>.json      ← 361 component (наша цель)
├── camel-catalog-aggregate-functions-<hash>.json       ← PropertiesFunction (ecos-secret — отдельная задача §6)
└── ... (8 других aggregate files + crd-схемы + camelYamlDsl)
```

**`aggregate-components-<hash>.json`** — единый JSON-словарь, ключ = имя компонента (`scheme`), значение:
```json
{
  "<scheme>": {
    "component": { "kind": "component", "scheme": "...", "syntax": "<scheme>:path", "javaType": "...", ... },
    "componentProperties": {},
    "properties": { "<name>": { "kind": "path"|"parameter", "type": "string", ... } },
    "propertiesSchema": { "$schema": "...", "type": "object", "required": [...], "properties": {...} }
  }
}
```
KaotoForm рендерит `propertiesSchema` напрямую. Lookup: для URI `ecos-event:record-created` Kaoto извлекает первый сегмент и зовёт `CamelCatalogService.getComponent(CatalogKind.Component, 'ecos-event')` — простой top-level lookup по имени.

**Mechanism injection:** extension-merge в существующий `serveCamelCatalogPlugin` (`vite.config.js`).

1. Source of truth — `public/camel-catalog-overrides/components.json` в репозитории под git, в формате aggregate-components (top-level ключи = имена наших компонентов).
2. В `serveCamelCatalogPlugin.readSanitized`, **после** `sanitizeCatalogJsonInPlace` и **до** возврата буфера: pattern-match имени файла `/aggregate-components-.*\.json$/` → если совпало, `Object.assign(parsed, overrides)` (shallow merge достаточно — мы только добавляем новые top-level ключи `ecos-event`/`ecos-endpoint`, не переопределяем поля существующих компонентов).
3. Тот же merge в `writeBundle`-walk'е (для prod-сборки).

Это даёт: source-of-truth в репозитории, никаких хешированных-имён в нашем коде (pattern-match), prod-сборка содержит final merged файл, dev — на лету через middleware.

### Acceptance spike

1. **Образец взять из `direct`-компонента** в текущем `aggregate-components-<hash>.json` — простой component с path-segment + query-params, тот же шаблон подходит для `ecos-event`. Скопировать структуру `component` / `properties` / `propertiesSchema`, заменить scheme/syntax/javaType.
2. Создать `public/camel-catalog-overrides/components.json` — entry для **одного** компонента `ecos-event`:
   - `component`: scheme=`ecos-event`, syntax=`ecos-event:eventName`, javaType=`ru.citeck.ecos.camel.events.EcosEventComponent`, label=`citeck,event`.
   - `properties`: `eventName` (`kind:path`, required), `recordType`/`typeRef`/`attributes` (`kind:parameter`) — взять из `ECOS_EVENT_PARAMS` в `citeckSchemas.js:16-34`.
   - `propertiesSchema`: JSON Schema с теми же properties, `required: ["eventName"]`.
3. Расширить `serveCamelCatalogPlugin` в `vite.config.js`: добавить merge-логику в `readSanitized` (после `sanitizeCatalogJsonInPlace`) и в `writeBundle`-walk. **Обязательно подвесить `fs.watch` на overrides-файл** и в callback'е делать `sanitizedCache.delete(<key>)` для всех закэшированных aggregate-components-файлов — без этого dev-итерация требует рестарта vite на каждое изменение overrides. Acceptance dev-flow: правка `components.json` → перезагрузка страницы в браузере → новые поля видны в `CanvasSideBar` без рестарта `yarn dev`.
4. В `KaotoModeler.jsx` `catalogUrl` уже указывает на `/camel-catalog` → проверить **оба сценария** использования компонента `ecos-event`:
   - **`from:` (триггер, основной use-case).** YAML с `from: { uri: "ecos-event:record-created", parameters: { recordType: document } }` парсится без ошибок (Kaoto не валится в RuntimeProvider). Клик на `from`-ноду → встроенный `CanvasSideBar` открывает нашу схему (recordType, typeRef, attributes из `ECOS_EVENT_PARAMS`). Edit поля → `codeChange` отдаёт нормальный YAML без kamelet-обёртки или `bean:`-преобразований. Round-trip параметров (recordType `document` → edit на `file` → re-parse) — без потерь.
   - **`to:` (отправка события).** YAML с `to: ecos-event:notify` парсится. Клик на `to`-ноду → `CanvasSideBar` открывает форму. Edit поля → `codeChange` отдаёт `to: ecos-event:notify?param=...` без обёрток.
5. Зафиксировать результат в `kaoto-catalog-extension.md` (новый): итоговый snippet `components.json` для `ecos-event`, листинг изменения `vite.config.js`, скриншот `CanvasSideBar` с открытой формой. Способ инжекта (extension-merge в существующий plugin) уже разобран в research-секции выше — повторять не надо.

### Если spike зелёный

**Находка 2026-04-28:** в `ecos-camel-core` `EcosEndpointComponent` **не существует** — есть только `EcosEndpointPropertiesFunction.kt` (`ru.citeck.ecos.camel.ecosendpoints`). То есть `ecos-endpoint:<name>/url` и `ecos-endpoint:<name>/credentials/<field>` — это **property-function**, ровно как `ecos-secret`, а не Camel-компонент. Используется как property-placeholder в параметрах других шагов: `http:{{ecos-endpoint:my-service/url}}`, `username={{ecos-endpoint:my-service/credentials/username}}`. Шаг с URI `to: ecos-endpoint:...` сам по себе не работает на стороне backend'а.

Следствия:
- **§1.1 в текущем виде отменяется** — каталожный override для `ecos-endpoint` не нужен, в `aggregate-components-*.json` его быть не должно (мы бы создали ложное обещание в форме).
- `ecos-endpoint` присоединяется к группе `ecos-secret` — **обоим нужен suggestion-provider** через `KaotoForm.SuggestionRegistryProvider` в parameter-fields. Подсказывать `<name>/url` и `<name>/credentials/{username|password|token}`. Это пост-MVP таск (см. §6.4), теперь он покрывает оба placeholder'а.
- В whitelist'е палитры §3 тайл `to:ecos-endpoint:<placeholder>` тоже **убирается** — нет смысла предлагать пользователю шаг, который не существует. Whitelist становится 17 тайлов (4 Citeck-domain → 3: `ecos-event:notify`, `records-dao`, `get-record-atts`).
- `bean:ecos-secret/<id>` спайкать **не нужно** по той же причине: `ecos-secret` — `PropertiesFunction` из `ecos-camel-core` (`EcosSecretPropertiesFunction.kt`, регистрируется в `EcosCamelContextImpl.kt:26`), не DSL-нода и не bean. Override на step type `bean` в текущем `citeckSchemas.js` ошибочен и никогда не срабатывал; он уйдёт в §2 вместе с файлом.

После зелёного §1 spike'а — переходим напрямую к §2 (никаких дополнительных catalog-overrides).

### Если spike красный (любой из трёх acceptance failed)

- Останавливаемся, документируем причину (kamelet-wrap / lookup mismatch / round-trip ломается).
- §3.0.3 переходит в полноценную задачу с эскалацией в Kaoto Zulip / GitHub Discussions (как и было заложено в план §436).
- Параграфы §2 и §3 этого плана **не делаем** — оставляем как есть, переключатель Required/Modified закрываем кастомным `tab=`-prop'ом в `StepForm.jsx`.

## §2. Удаление дублирующей property-формы (0.5 дня, **гейт — §1 зелёный**)

После того, как Citeck-overrides уехали в каталог:

1. В `KaotoModeler.jsx`:
   - Убрать `selectedStepId` state и `selectedStep` `useMemo` (строки 45, 50–53).
   - Убрать ветку `rightTab === 'properties'` (строки 174–182). Заменить state `rightTab: 'properties' | 'yaml'` на `viewMode: 'visual' | 'split' | 'yaml'` с дефолтом `'visual'`.
   - Layout по режимам:
     - **`visual`** (дефолт) — канвас 100% ширины, правая панель не рендерится.
     - **`split`** — канвас слева 60% + Monaco справа 40% (текущий side-by-side минус property-tab).
     - **`yaml`** — Monaco 100% ширины, канвас не рендерится.
   - Переключатель режимов — controlled в `KaotoModeler` с самого начала: реализуем как `viewMode`/`onViewModeChange` props с дефолтом `'visual'`, fallback на internal state если props не переданы. На этапе §2 рендерим его в верхнем тулбаре над канвасом, в §4 — `CamelDslEditor` поднимает state и рендерит переключатель в header'ной строке 2, передавая props внутрь. Решение зафиксировано **до** старта §4, чтобы избежать переноса AddStep-кнопки и переключателя дважды.
   - `Apply to canvas` остаётся manual-кнопкой (sync-модель не меняется), отображается только в режимах `split` и `yaml` (в `visual` нет источника edits с Monaco-стороны, кнопка не нужна).
2. Удалить файлы:
   - `src/components/ModelEditor/KaotoModeler/StepPicker.jsx`
   - `src/components/ModelEditor/KaotoModeler/StepForm.jsx`
   - `src/components/ModelEditor/KaotoModeler/catalogResolver.js`
   - `src/components/ModelEditor/KaotoModeler/citeckSchemas.js` (после того, как содержимое **полностью** перенесено в `public/camel-catalog-overrides/` и проверено).
3. В `yamlSteps.js` — оставить как есть; всё ещё нужен для feature-3 (палитра — нужна выборка current-route AST для insert-by-path), и потенциально для будущих feature'ов.
4. Snapshot/manual-test:
   - Click `setBody` → `CanvasSideBar` показывает SetBodyDefinition с OneOf-picker'ом «Schema 0 / Expression» (план §376).
   - Click `to: ecos-event:record-created` → `CanvasSideBar` показывает нашу схему из каталога.
   - Edit любого поля → `codeChange` → YAML обновляется → `Apply to canvas` re-mount'ит без потерь.

### Acceptance §2

- Console чистая (≤ 5 warning'ов как было).
- Нет более «двух форм для одного шага».
- Переключатель `Visual / Split / YAML` работает: `visual` — канвас на всю ширину, `split` — 60/40, `yaml` — Monaco на всю ширину. Дефолт при открытии страницы — `visual`.
- При смене режима `visual` ↔ `split` ↔ `yaml` `yamlState` не теряется (хранится в state `KaotoModeler`).

## §3. Стартовая палитра «Add Step» (1.5 дня)

Поскольку Kaoto не экспортирует palette-sidebar (см. шапку плана), собираем минимально-достаточный из **публично-экспортируемых** примитивов: `Catalog` (тайл-сетка с фильтром по тегам, `@kaoto/kaoto` главный entry) + наш handler через YAML-mutation поверх контракта `RouteVisualization`. Programmatic step-insertion API (`addStep`/`useEntityContext`) формально экспортируется в lib, но **не реэкспортируется в `public-api.ts`** — для нашего embedding-mode'а недоступен без internal-imports. Insert-after-selected и drag-from-palette в этом mode'е невозможны (см. §«Что НЕ входит»).

### Минимальный scope MVP

Палитра §3 — **click-to-add**, не drag-drop. Drag-drop из нашей палитры на конкретную точку канваса требует Kaoto-internal drop-target API (наружу не торчит ни в 2.9, ни в 2.11-RC1). В MVP заменяем его комбинацией «click-to-add → reorder drag'ом по канвасу» — drag-reorder между уже существующими нодами в Kaoto родной и после Patch A работает (см. [kaoto-integration-plan.md §673](../kaoto-integration-plan.md)).

Полный flow добавления компонентов в MVP — **три пути, ни одна дыра не остаётся**:

| Откуда | Как |
|---|---|
| Curated whitelist (18 тайлов: 10 DSL-core + 4 Citeck-domain + 4 External) | **Наша палитра §3** → click на тайл → шаг append'ится в конец `steps:` |
| Полный Camel-каталог (613 компонентов) | **Родной Kaoto «+ Add step»** на ноде канваса → вставка после выбранной ноды (фича `Canvas`, после Patch A работает) |
| Перемещение | **Drag по канвасу** между существующими нодами (родной Kaoto) |

Реализация нашей части (первая строка таблицы):

- **Кнопка «+ Add step» в нашем тулбаре над канвасом** (не sidebar — оставляем layout простым, плюс это hint, что палитру можно будет вынести позже без перестройки).
- Клик на кнопку → modal с `Catalog`-сеткой Kaoto. Тайлы — компоненты Citeck-domain'а, для MVP **жёстко заданный whitelist** (см. ниже), не весь Camel-каталог.
- Клик на тайл → закрываем modal → шаг добавляется в конец `steps:` текущего маршрута. Если пользователю нужно вставить «в середину» — добавляет в конец и перетаскивает на место drag'ом по канвасу. Если нужен компонент вне whitelist'а — использует родной «+ Add step» Kaoto на ноде.
- Insert-логика: парсим текущий `yamlState`, добавляем шаг через `setByPath`, дёргаем `setYamlState` + `propagate`. Это уже умеет наш `yamlSteps.js`.
- **Auto-remount канваса после programmatic insert.** `handleAddStep` дополнительно делает `setCanvasYaml(newYaml)` + `setCanvasMountKey(k => k + 1)` — без `Apply to canvas`. Безопасно: YAML мы сами сериализовали из распарсенного AST → гарантированно валидный, риск parse-crash как у hand-edit'а отсутствует. Sync-модель в JSDoc `KaotoModeler` обновляется: «авто-remount для programmatic operations (palette, future context-menu); manual Monaco-edit — по-прежнему под `Apply to canvas`».
  - **Side-effect:** auto-remount обнуляет текущий выбор ноды в `CanvasSideBar` (sidebar закрывается). Для click-to-add в конец `steps:` это терпимо и согласуется с UX «добавил → переключился на новый шаг», но мы фиксируем это явно в JSDoc и в acceptance §3.
  - **Мини-spike перед коммитом auto-remount'а (≤30 минут):** попробовать передать новый `code` в `RouteVisualization` без bump'а ключа. Kaoto uncontrolled, но для аддитивного diff'а внутренний YAML-парс может «догнать» дельту извне; если это работает — selection не теряется и решение чище. Если нет — оставляем remount-стратегию, описанную выше.

### MVP whitelist тайлов — расширенный (17)

Группируем по тегам Kaoto-`Catalog` (он умеет фильтр по тегам из коробки, см. `lib/components/Catalog/Tags/CatalogTagsPanel.js` в @kaoto/kaoto). Три категории, отображаются в Tags-панели слева modal'а.

**DSL — Camel core (10 тайлов).** Стандартные процессоры маршрутизации, нужны почти в каждом маршруте:

1. `setHeader` — установить заголовок
2. `setBody` — установить тело сообщения
3. `setProperty` — установить exchange property (передача значения между шагами без headers)
4. `removeHeader` — удалить заголовок
5. `choice` — ветвление (when/otherwise)
6. `filter` — условный пропуск
7. `split` — разбить на части и обработать каждую
8. `log` — логирование (`log:info`)
9. `marshal` — сериализация (JSON / XML / CSV)
10. `unmarshal` — десериализация

**Citeck-domain (3 тайла).** Citeck-специфичные шаги, ради которых, собственно, своя палитра имеет смысл (родной Kaoto «+ Add step» на ноде покажет их в списке всех 613 компонентов без выделения в Citeck-категорию):

11. `to:ecos-event:notify` — отправить событие в шину Citeck
12. `to:records-dao:<src>` — обращение к Records-DAO (импорт/экспорт записей, ср. план §1.1 `RecordsDaoEndpoint`)
13. `process:get-record-atts` — получение атрибутов записи (план §1.1 `GetRecordAttsProcessor`)

> Изначально планировался четвёртый тайл `to:ecos-endpoint:<placeholder>`, но `ecos-endpoint:` в `ecos-camel-core` — это `PropertiesFunction` (`EcosEndpointPropertiesFunction.kt`), а не Camel-компонент. Шаг с таким URI на backend'е не существует. Помощь по `{{ecos-endpoint:...}}` (вместе с `{{ecos-secret:...}}`) — через suggestion-provider в parameter-fields, см. §6.4.

**External integrations (4 тайла).** Самые частые внешние интеграции в production-маршрутах:

14. `to:rabbitmq:<queue>` — публикация в очередь
15. `to:http:<url>` — внешний REST-вызов
16. `to:smtp:<server>` — отправка email
17. `to:direct:<name>` — вызов другого роута внутри того же CamelContext (sub-flow / multi-route apps)

**Итого: 17 тайлов**, помещается на одном экране в сетке. Категории в `CatalogTagsPanel` помогают ориентироваться при росте до 20–25 (если потом добавим).

Что осталось **за пределами whitelist'а**:
- 5 `ecos-event:record-*`-триггеров из §1.1 — это `from:`-узлы, задаются при создании маршрута (см. §5 «Создание route с нуля»), а не через Add Step.
- `{{ecos-secret:<id>/<field>}}` — Camel `PropertiesFunction` (`ecos-camel-core/EcosSecretPropertiesFunction.kt`), резолвится в значение в параметрах других шагов. В палитре шагов не нужен — это не шаг. Suggestion-provider/автокомплит в parameter-fields — отдельная задача после MVP (см. §6).
- Остальные ~595 компонентов Camel-каталога доступны через **родной Kaoto «+ Add step»** на любой ноде канваса.

### Файлы

Новые:
- `src/components/ModelEditor/KaotoModeler/AddStepButton.jsx` — кнопка над канвасом + state открытия modal'а.
- `src/components/ModelEditor/KaotoModeler/AddStepModal.jsx` — modal с Kaoto-`Catalog`'ом, фиксированный whitelist тайлов.
- `src/components/ModelEditor/KaotoModeler/addStepTiles.js` — массив `ITile[]` для whitelist'а; описывает, какой YAML-snippet вставлять при клике.

Изменения:
- `KaotoModeler.jsx` — render `<AddStepButton onAdd={handleAddStep} />` поверх или над `<RouteVisualization>`. `handleAddStep(snippet)` — вставляет snippet в `parsed.ast.steps` и пушит `dumpYaml(ast)` → `setYamlState`.

### Acceptance §3

- Кнопка «+ Add step» видна над канвасом.
- Клик → modal с 17 тайлами в трёх категориях `DSL — Camel core` / `Citeck-domain` / `External integrations` (Kaoto-`Catalog` визуал — иконки, теги, фильтры).
- Клик на любой тайл → modal закрывается, в YAML появляется новый шаг в конце `steps:`, **канвас немедленно рисует новый шаг** (auto-remount после programmatic insert, без нажатия `Apply to canvas`). Hand-edit YAML в Monaco — по-прежнему через `Apply`.
- При auto-remount текущий выбор ноды в `CanvasSideBar` сбрасывается (sidebar закрывается) — это ожидаемое поведение MVP, зафиксированное в JSDoc `KaotoModeler` и в этом плане. Если мини-spike (см. выше) показал, что remount можно избежать — selection сохраняется и пункт acceptance переходит в «sidebar остаётся открытым на ранее выбранной ноде».
- Нет console-ошибок, нет дублирования id'ов в маршруте.

## §4. Доработка макета страницы `CamelDslEditor` (0.5 дня)

Сейчас `src/pages/ModelEditor/CamelDslEditor/CamelDslEditor.jsx:127-156` рендерит **пять отдельных вертикальных блоков** перед канвасом — `h2 + name + state` (строка 128–132), `recordRef:` (133–135), `Loading…` (136), `Error:` (137–141), Save-button (142–150) — и только потом уходит во `flex: 1` на сам `KaotoModeler`. На стандартном экране это съедает 120–160 px вертикали ради статус-меток, при том что у нас правее канваса появится ещё и Add Step toolbar (§3) — а сам канвас Kaoto уже плотно занят (свои tabs, mini-map, control-bar).

Цель — собрать всё служебное в **2–3 компактных строки** в `<header>`, отдать канвасу остальное.

### Acceptance §4

1. **Заголовочная зона = ровно 2 строки** (3-ю допускаем только при ошибке):
   - **Строка 1 (32–36 px):** title `Camel DSL editor` (или iconified `< →` назад в `ModelEditor`-листинг) + `name` в `<strong>` + `state` как badge → справа: основной action-блок (`Save` — primary, `Apply to canvas` если включаем сюда из `KaotoModeler`, `Add step` из §3 — могут переехать сюда из тулбара канваса, обсуждаемо). Spinner `Saving…` / `Loading…` — inline в кнопку (`disabled` + текст), а не отдельная строка.
   - **Строка 2 (24–28 px):** `recordRef: <code>...</code>` + переключатель `Visual / Split / YAML` (см. §2.1, controlled — `CamelDslEditor` держит state и пробрасывает `viewMode`/`onViewModeChange` в `KaotoModeler`; внутренний тулбарный переключатель из §2 удаляется) + флаг unsaved-changes («●»). Если экран узкий — `recordRef` сворачивается в иконку с tooltip'ом.
   - **Строка 3 (опц., только при `error !== null`):** alert-баннер с текстом ошибки + кнопка «×» закрыть. По умолчанию строка не существует.
2. **Канвас + правая панель = `flex: 1`**, занимает всё остальное (минимум 75% высоты viewport на стандартном 1080p-экране).
3. **Никакого `padding: 16` на root** — header сам имеет `12px 16px`, основная область вплотную к краям окна (как в BPMNEditor).
4. **Inline-styles → CSS-классы** в `CamelDslEditor.scss` (создать файл): `.camel-dsl-editor`, `.camel-dsl-editor__header`, `.camel-dsl-editor__title`, `.camel-dsl-editor__meta`, `.camel-dsl-editor__error`, `.camel-dsl-editor__body`. Выровнять с visual-стеком ecos-ui (Bootstrap-токены или ecos-design-tokens — что ближе по соседним страницам, см. `BPMNEditor.scss` как образец).
5. **`Loading…` без layout-shift'а:** если страница ещё грузит content — рендерим header в финальном виде (с `disabled` Save), а в области канваса — spinner-overlay по центру. Не текстовая строка между header'ом и канвасом.
6. **Скрыть Kaoto `RuntimeSelector` из `ContextToolbar`.** Это dropdown «Camel Main 4.14.2.redhat-00011» в верхнем-левом углу канваса. Runtime/version у нас зафиксирован хардом в [§-0.4 catalogResolver.js](../kaoto-integration-plan.md), пользователю переключать нечего, кнопка только мешает и вводит в заблуждение. `RouteVisualization` пропа отключить не предоставляет (`{ catalogUrl, code, codeChange, className }` — и всё), поэтому скрываем через CSS:
   ```scss
   // KaotoModeler.scss или CamelDslEditor.scss
   .kaoto-modeler__canvas [data-testid="runtime-selector-list-dropdown"],
   .kaoto-modeler__canvas .runtime-selector__submenu {
     display: none !important;
   }
   ```
   Якоря: `data-testid="runtime-selector-list-dropdown"` (`RuntimeSelector.js:66`) — стабильный публичный testid, не лопнет при минорных bump'ах Kaoto. Класс `runtime-selector__*` — на случай если Kaoto когда-то снимет testid. Двойной якорь — недорого. После hide'а проверить, что сам `ContextToolbar` остаётся (там есть полезные кнопки — fit-to-screen, layout-direction); пропадает только runtime-selector tile.

### Файлы

- `src/pages/ModelEditor/CamelDslEditor/CamelDslEditor.jsx` — переписать render-часть (строки 126–157).
- `src/pages/ModelEditor/CamelDslEditor/CamelDslEditor.scss` (новый) — стили header'а и body.
- `src/components/ModelEditor/KaotoModeler/KaotoModeler.scss` (новый) — `display: none` для `RuntimeSelector` (см. п. 6 выше). Альтернативно — положить правило в `CamelDslEditor.scss` под `.camel-dsl-editor` scope (тогда селектор работает только на нашей странице, не в случайных будущих местах embed'а Kaoto).
- Возможно `src/pages/ModelEditor/CamelDslEditor/Header.jsx` (новый) — если render-часть header'а становится больше 30 строк, выносим. По умолчанию оставляем inline в `CamelDslEditor.jsx`.

### Что НЕ трогаем

- Внутренний layout `KaotoModeler.jsx` (canvas / Monaco / Add step) — отдельная задача §2 + §3, не часть §4.
- Адаптив под mobile — фича не нужна для editor-страницы (по факту админский UI), оставляем минимум 1024×600 как нижний предел.
- i18n строк header'а — заведём при общей i18n-проходке Kaoto-страницы (план §6 «Тесты, доки, i18n»).

## §5. Создание маршрута с нуля внутри editor'а (1.5 дня)

Сейчас `CamelDslEditor.jsx:54-59` поддерживает только режим **edit existing**: если `recordRef` есть в URL — грузим content; если нет — falls back на `SAMPLE_YAML` (debug-fallback, не «новый маршрут»). Полноценного создания нет — record предполагается созданным где-то выше (automation wizard, journal-handler и т.п.). Для MVP добавляем **inline new-mode**: открыть editor без recordRef, выбрать триггер, начать редактировать, при первом Save — создать запись.

### UX

**Detection:** URL `/v2/camel-dsl-editor?new=true` (или `?new=true&type=<typeRef>` для будущей кастомизации). Если `recordRef` нет и `new !== 'true'` — показываем плашку «No record selected. Open via `?recordRef=...` or `?new=true`.» (без debug-fallback на SAMPLE_YAML — `SAMPLE_YAML` либо удаляется вовсе, либо переезжает в storybook/dev-mode).

**Flow:**

1. Открыть `?new=true` → editor рендерит **header в new-mode**: Name-input (опц.), Trigger-dropdown с placeholder «✱ Pick a trigger», disabled Save (пока триггер не выбран). Канвас показывает empty-state «Pick a trigger to start» (centered hint, без YAML, без RouteVisualization).
2. Trigger-dropdown содержит:
   - **Citeck Events (категория):** 5 типов из [§1.1](../kaoto-integration-plan.md) — `ecos-event:record-created`, `record-changed`, `record-status-changed`, `record-deleted`, `record-content-changed`. Опциональное поле `recordType` после выбора (проставляется в `from.parameters.recordType`).
   - **Camel core (категория):** `timer:` (для cron/scheduled), `direct:` (для invoke from другого route), `quartz:` (cron, advanced) — для общих сценариев. Без полноценного wizard для каждого, ставится дефолтный URI с placeholder (`timer:tick?period=60000`).
3. Pick trigger → генерим initial YAML:
   ```yaml
   - route:
       id: route-<uuid>
       from:
         uri: "<picked-trigger-uri>"
         parameters:
           <если есть>: <дефолт>
         steps: []
   ```
   Передаём в `KaotoModeler` → канвас оживает, появляется одна `from`-нода + пустой `steps:`. Save становится enabled. Дальше пользователь добавляет шаги через палитру §3 или родной «+ Add step» Kaoto.
4. **Save в new-mode.** `Records.create` в нашем API создаёт **виртуальную in-memory запись** (см. `src/components/Records/Records.ts:69`, сигнатура `create(data, owner)`, owner обязателен, без сетевого вызова и без `sourceId`) — для записи в конкретный sourceId он не подходит. Используем канонический ecos-ui-паттерн — `Records.get('<sourceId>@')` (висящий `@` = пустой id):
   ```js
   const draft = Records.get('integrations/camel-dsl@');
   draft.att('type', 'YAML');
   draft.att('state', 'STOPPED');
   draft.att('content', yaml);
   const newId = await draft.save(); // возвращает реальный id вида 'integrations/camel-dsl@<uuid>'
   ```
   Образец живого кода — `src/pages/BPMNVersionsMigration/MigrationInfo/MigrationInfo.jsx:77` (`Records.get('eproc/bpmn-process-migration@')`). Имя/`startupType`/`file` — не передаём, defaults. Дальнейшие Save (в edit-mode) идут через `Records.get(newId).att('content', yaml).save()` (`state` не трогаем — для start/stop есть UI-action `start-camel-dsl` из типа).
5. **Переключение URL без full reload.** `window.history.replaceState` обновит только адресную строку — react-router не пересчитает props и `recordRef` в компоненте останется `null`. Используем history-объект из `react-router` (или `useHistory`/`useNavigate` в зависимости от версии в `App.jsx`) — `history.replace({ pathname, search: '?recordRef=' + encodeURIComponent(newId) })`. Альтернатива на случай, если router-аргумент в editor'е нетривиально получить — поднять `recordRef` в локальный state страницы (а из URL читать только initial value), синхронизировать его с router'ом одним эффектом; но default — router'овский `replace`.
6. **Стратегия `key` у `KaotoModeler`.** Текущий `key={recordRef || 'sample'}` (`CamelDslEditor.jsx:153`) при new→edit переключении ремоунтит канвас и теряет in-memory edits. Простой `useState(() => recordRef || 'new-' + Date.now())` ломает межзаписную навигацию (recordRef A → recordRef B оставит ключ зафиксированным на A). Правильный вариант — sentinel, активный только пока мы в new-mode:
   ```js
   const newSessionRef = useRef(recordRef ? null : 'new-' + Date.now());
   // если стартовали с recordRef — newSessionRef.current = null навсегда, key = recordRef (текущее поведение)
   // если стартовали в new-mode — newSessionRef.current зафиксирован; пока он не null, key = newSessionRef.current
   // после первого Save: newSessionRef.current = null + setRecordRef(newId) — key переходит на recordRef и дальше работает как в edit-mode
   const key = newSessionRef.current ?? recordRef ?? 'sample';
   ```
   Эффект: канвас не ремоунтится при new→edit; при последующих edit→edit (если в будущем появится навигация между recordRef'ами без full reload) — ремоунтится корректно по смене ключа.
7. Если триггер потом надо сменить — через клик на `from`-ноду в канвасе → `CanvasSideBar` (после §1 поднимет нашу `ecos-event`-схему из каталога). Header'ный Trigger-dropdown в edit-mode скрывается.

### Acceptance

1. URL `/v2/camel-dsl-editor?new=true` открывает editor в new-mode без ошибок.
2. До выбора триггера: канвас в empty-state, Save disabled.
3. Pick `ecos-event:record-status-changed` → канвас рисует одну `from`-ноду, Save enabled.
4. Add Step через палитру §3 (`log:info`) → шаг появляется в YAML и на канвасе.
5. Save → создан новый record → URL обновлён → следующий Save идёт по update-path (Records API mutate, не create).
6. Reload страницы по новому URL'у с recordRef'ом → грузит свежесозданный маршрут как обычный edit-flow.
7. Трюки edge-case:
   - Save без триггера должен быть disabled, не permitted.
   - Cancel/back в new-mode (без сохранения) — данные не утекают, record не создан.

### Файлы

- `src/pages/ModelEditor/CamelDslEditor/CamelDslEditor.jsx` — расширить mode detection, добавить new-mode header (Trigger-dropdown, Name-input, empty-canvas placeholder).
- `src/pages/ModelEditor/CamelDslEditor/triggerCatalog.js` (новый) — массив доступных триггеров (8 штук: 5 Citeck + 3 Camel core), для каждого: `key`, `label`, `category`, `defaultUri`, `defaultParameters`, опциональные `extraFields` (для `recordType` у `ecos-event:*`).
- `src/pages/ModelEditor/CamelDslEditor/initialRoute.js` (новый) — функция `buildInitialYaml(triggerKey, params)` → возвращает YAML-string с `from:` и пустым `steps:`. Использует `dumpYaml` из `yamlSteps.js`.
- `src/pages/ModelEditor/CamelDslEditor/CamelDslEditor.scss` (от §4) — добавить стили new-mode header'а и empty-canvas placeholder'а.

### Контракт записи (research выполнен 2026-04-28, проверено на локальном стенде)

Все 5 «открытых вопросов» закрыты, §5 не заблокирован.

**typeRef:** `emodel/type@ecos-camel-dsl`
**sourceId для создания** (`Records.get('<sourceId>@').att(...).save()`)**:** `integrations/camel-dsl` (через ecos-gateway; внутри `ecos-integrations` — `camel-dsl` через proxy на `camel-dsl-repo`).

Подтверждено: на стенде type задеплоен, `system: true`, `queryPermsPolicy: PUBLIC`, `parentRef: emodel/type@ecos-vcs-object`, `model.attributes = [type, startupType, state, content, file]`.

**Атрибуты при создании** (`draft.att(name, value)` перед `draft.save()`)**:**
- `type` — обязательный, enum `CamelContextType`. Значение: `'YAML'` (только YAML поддерживается, см. `CamelDslDto.java`).
- `state` — обязательный, enum `CamelContextState` = `STOPPED | STARTED | SUSPENDED`. **При создании — `'STOPPED'`** (нет авто-запуска). Активация — отдельным шагом через готовое UI-action `uiserv/action@start-camel-dsl` (см. `actions:` в типе).
- `content` — обязательный, `String`, наш YAML.
- `startupType` — опциональный, enum `CamelContextStartupType` = `MANUALLY | IMPORT_DATA`. Default `MANUALLY` — не передаём при create.
- `file`, `id`, `name` — опциональные.

**Lifecycle hook'и (`CamelDslMutateProxyProcessor`):**
- Смена `state` → `camelDslService.startContext`/`stopContext`/`suspendContext`.
- Смена `content` → `camelDslService.recreateContext` (обновление пересоздаёт Camel-контекст).

**Permissions:** `DefaultDbPermsComponent`. Стандартные user-perms; admin = WRITE. На стенде admin может создавать беспрепятственно. В UI: предусмотреть disabled Save + tooltip «No permission» если у пользователя нет права mutate (через `Records.get(typeRef).load({ permissions: 'permissions._has.Write?bool!' })` или аналогом).

**Entry-point в журнале:** `journalRef: uiserv/journal@ecos-camel-dsl`, `formRef: uiserv/form@ecos-camel-dsl-form`. Текущий create flow в типе — единственный variant `upload` (заливка готового YAML-файла через `uiserv/form@ecos-artifact-upload`). Наш new-mode editor — это **второй createVariant** в типе с переходом на нашу страницу `?new=true` (либо отдельный `uiserv/action`, который открывает страницу). Записи, созданные через нас, **не orphan** — они привязаны к тому же типу, видны в журнале как обычно. Конкретный механизм entry-point'а (createVariant с redirect URL vs новый action) — обсудить при имплементации §5; добавление createVariant'а в `ecos-integrations/.../ecos-camel-dsl.yml` — отдельный PR в `ecos-integrations`, идёт параллельно с §5.

### Что НЕ входит

- **Wizard формирования первого шага** (after picking trigger, no auto-suggest of common patterns). Pick trigger → пустой `steps:`, дальше пользователь сам.
- **Templates маршрутов** («Notification on status change», «Sync with Bitrix», etc.). Это план §-после-MVP §3 в [основном плане](../kaoto-integration-plan.md). Здесь — только bare-trigger.
- **Validation триггера до создания** (например, проверка существования `recordType`'а в emodel). Backend'овый job, не UI.
- **Cancel-confirm modal** при back/leave из new-mode без сохранения. Если время есть — добавим, иначе можно полагаться на browser'ный confirm via `beforeunload` (стандартная практика в ecos-ui).
- **createVariant в `ecos-integrations/.../ecos-camel-dsl.yml`** (entry-point из журнала «Создать → Camel DSL → новый маршрут с нуля»). Это отдельный PR в `ecos-integrations`, **не блокирует MVP §5**: для сдачи MVP достаточно URL-доступа `?new=true` (через прямую ссылку/закладку/dev-меню). createVariant заводится параллельно или после MVP, фиксируется как follow-up issue в Citeck Project Tracker. Если делается в рамках §5 — добавить ~1 час к бюджету этой секции и acceptance-пункт «createVariant виден в журнале `uiserv/journal@ecos-camel-dsl`, открывает нашу страницу с `?new=true`».

## §6. Документация и план (0.5 дня)

1. В `kaoto-integration-plan.md`:
   - §3.0.3 пометить как ✅ (с датой), сослаться на этот файл.
   - §1.1/§1.2 («Каталог компонентов Citeck») — обновить, что Citeck-overrides физически живут в `public/camel-catalog-overrides/`, не в JS-коде.
   - §733 уже поправлен этой итерацией (ссылается сюда).
2. В `KaotoModeler.jsx` JSDoc — обновить «известные ограничения» и sync-модель: убрать упоминание `StepPicker`/`StepForm`, добавить про `AddStepButton`, про триплет режимов `viewMode`, и про auto-remount канваса после programmatic insert (palette) при сохранении manual `Apply` для hand-edit Monaco.
3. В `kaoto-sandbox/FINDINGS.md` — добавить раздел про catalog-extension API (если делали через нестандартный путь).
4. В `kaoto-integration-plan.md` зафиксировать **отложенную задачу — suggestion-provider для placeholder'ов `PropertiesFunction` в parameter-fields.** Это `KaotoForm`'овский `SuggestionRegistryProvider` из `@kaoto/forms` (уже подключён в `KaotoModeler.jsx:107`), а не catalog-override. Покрывает обе функции:
   - `{{ecos-secret:<id>/<field>}}` — `username | password | token` после `<id>/`.
   - `{{ecos-endpoint:<name>/<field>}}` — `url` или `credentials/<secret-field>` после `<name>/` (cм. `EcosEndpointPropertiesFunction.kt:23–47`, supported fields = `url`, `credentials`).

   Scope ≈ 0.5 дня, итерация после MVP. Связано с §1.1 этого плана (§1.1 отменён в пользу этой задачи: `ecos-endpoint` оказался `PropertiesFunction`, а не Camel-component'ом).
5. **Запланировать check-in на T+2 месяца после деплоя MVP** — пересмотреть, надо ли стартовать миграцию embedding-mode на `multiplying-architecture` / `KaotoEditorFactory` (см. [kaoto-integration-plan.md §8 п.8](../kaoto-integration-plan.md)). На check-in'е оценить четыре триггера:
   - (а) Пользовательский фидбек: достаточно ли палитры §3 (curated whitelist) и нашего suggestion-provider'а для `{{ecos-secret:...}}`, или явный запрос на нативную палитру/multi-route nav/полноценный suggestion-API?
   - (б) Upstream Kaoto: обогатился ли `KaotoEditorChannelApi` за 2 месяца фичами, которые нам нужны? Обогатился ли `RouteVisualization`-контракт (slots, additional toolbar)? Если первое — да, второе — нет, это сигнал в пользу миграции.
   - (в) Стабильность контракта: были ли minor-bump'ы Kaoto, которые ломали наш round-trip? Если да — мы платим за «undocumented surface», и iframe становится honest-trade.
   - (г) Расширение scope'а: появился ли второй потребитель Kaoto-редактора (Kamelets/Pipes/AI assistant route generator)? Узкий `RouteVisualization`-контракт его блокирует — повод мигрировать.

   По итогам — решение: остаёмся на `RouteVisualization` (✅), стартуем iframe-миграцию (3–6 недель плотной работы, см. §8 п.8), либо пересматриваем check-in ещё на 2 месяца. Зафиксировать в Citeck Project Tracker как issue с дедлайном.

## Итог по срокам

| Шаг | Время | Гейт |
|---|---|---|
| §1. Spike `ecos-event` через каталог | 1 день | — |
| §1.1 ~~Перенос `ecos-endpoint`~~ — отменён, `ecos-endpoint` это `PropertiesFunction`, переходит в §6.4 suggestion-provider | 0 | — |
| §2. Удаление StepPicker/StepForm/resolver/citeckSchemas | 0.5 дня | §1 ✅ |
| §3. AddStepButton + AddStepModal + whitelist tiles | 1.5 дня | §2 ✅ |
| §4. Layout polish `CamelDslEditor` (header в 2–3 строки, canvas во весь экран, hide RuntimeSelector) | 0.5 дня | §2 ✅ (можно параллельно §3) |
| §5. Создание route с нуля (new-mode + Trigger picker + create через `Records.get('<sourceId>@')`) | 1.5 дня | §1 ✅, §4 ✅ |
| §6. Doc-апдейт | 0.5 дня | §3, §4, §5 ✅ |
| **Итого** | **~5.5–6 дней** | |

## Риски

- **Spike §1 красный** — самый материальный риск. Митигация: §3.0.3 в основном плане отдельно стоит как research-task, эскалация в Kaoto-сообщество — нормальный путь. Этот план не разваливается, просто §2 и §3 переносятся за §3.0.3.
- **`Catalog` Kaoto не масштабируется до 361 тайла без жёсткой фильтрации** — мы и не пытаемся, MVP whitelist 18 тайлов. Если пользователю нужно больше — будет следующий итерационный плагин.
- **Insert-at-end вместо insert-after-selected** — UX компромисс MVP. После того как селект CanvasSideBar'а станет наблюдаемым (через Kaoto API или подписку на `EntitiesContext`), можно будет вставлять «после выбранного шага».
- **Round-trip формат YAML** — общий риск интеграции (план §3.0.4, auto-id), не специфичен этому плану. Whitelist snippet'ов делаем с явными `id:` чтобы не плодить случайные.
- **Embedding mode (`RouteVisualization`) — undocumented public surface.** Команда Kaoto экспортирует компонент в `@kaoto/kaoto/components` (subpath-export, единственный компонент в `components-api.ts`), но **не документирует** его в [kaoto.io/docs](https://kaoto.io/docs/installation/) и **не использует сама** — официальный VS Code extension идёт через [`multiplying-architecture`/`KaotoEditorFactory`](https://github.com/KaotoIO/vscode-kaoto/blob/main/src/webview/KaotoEditorEnvelopeApp.ts) (iframe + KIE Tooling Bridge). Контракт `{ code, codeChange, catalogUrl, className }` минимален и стабилен, но обогащения surface'а (slots, hooks, programmatic step-API наружу) от upstream'а ждать не стоит. Все интеграционные расширения — на нашей стороне (catalog override, suggestion-provider в `KaotoForm`) или через миграцию на `multiplying-architecture` (post-MVP, см. ниже).

## Что НЕ входит в этот MVP-план (намеренно)

- **Drag тайла из нашей палитры на конкретную точку канваса** одним жестом. Требует Kaoto-internal drop-target API на нодах (`@dnd-kit` setup, drop-target ID'шники не экспортируются). Замена в MVP: click-to-add в конец `steps:` → reorder drag'ом по канвасу (родной Kaoto). Лишний шаг мышкой, но функционально add+position покрыт.
- **Insert-after-selected** в нашей палитре (вставить шаг сразу после выбранной ноды). Требует чтение selection из `EntitiesContext`/`useEntityContext`, которые экспортированы в `lib/`, но **не реэкспортированы в `public-api.ts`** — то есть достижимы только через internal-imports `@kaoto/kaoto/lib/esm/...`, что ломается на минор-bump'ах. Замена в MVP: end-insert + drag-reorder по канвасу.
- **Полноценная переход на iframe-embedding (`multiplying-architecture` / `KaotoEditorFactory`)** — это upstream-supported путь для богатого embedding'а: даёт родную палитру-sidebar, multi-route nav, settings, все 5 режимов вставки, `KaotoEditorChannelApi.getSuggestions` для `{{ecos-secret:...}}`, `onStepUpdated` для аудита, `getResourcesContentByType` для подкачки kamelets. Scope ≈5–10 дней + web-component/iframe wrapper в ecos-ui + замена `RouteVisualization` на `KaotoEditorFactory` через `@kie-tools-core/editor`. **Post-MVP направление миграции**, фиксируется в основном [kaoto-integration-plan.md](../kaoto-integration-plan.md) как evaluation-task.
- Полный каталог 613 компонентов (361 component + 252 DSL-node) в одной сетке нашей палитры. Сначала нужен серьёзный UX-дизайн фильтрации/категоризации; для MVP whitelist 18 тайлов + родной Kaoto-«+ Add step» на ноде покрывают остальные случаи.
- **Reorder/copy/delete шагов через свой UI.** Reorder и delete — родные Kaoto (drag по канвасу, context-menu на ноде, верифицируем в browser в рамках §1). Copy — только через YAML-таб.
- Двусторонняя синхронизация selection canvas ↔ внешний outline. После удаления `StepPicker` outline'а у нас просто нет — `CanvasSideBar` сам по себе есть outline по контексту клика.

## Acceptance — итоги (2026-04-28)

План реализован полностью, все §§ закрыты в коде, прогон acceptance в браузере выполнен вручную.

| § | Артефакт / поведение | Результат |
|---|---|---|
| §1 | `public/camel-catalog-overrides/components.json` (`ecos-event` entry) + extension-merge в `serveCamelCatalogPlugin` (vite.config.js, +318 строк) с `fs.watch` hot-reload | ✅ |
| §1 | `from: ecos-event:record-created` парсится без kamelet-обёртки, `CanvasSideBar` рендерит схему из каталога, round-trip без потерь | ✅ |
| §1 | `to: ecos-event:notify` — то же поведение | ✅ |
| §2 | `StepPicker.jsx` / `StepForm.jsx` / `catalogResolver.js` / `citeckSchemas.js` удалены | ✅ |
| §2 | Переключатель `viewMode: visual / split / yaml` (дефолт `visual`), `yamlState` сохраняется при смене режима | ✅ |
| §2 | Console чистая (без новых warning'ов), форма свойств одна — нативный `CanvasSideBar` | ✅ |
| §3 | Кнопка `+ Add Step` в тулбаре над канвасом | ✅ |
| §3 | Modal с Kaoto `Catalog`-сеткой и whitelist'ом 17 тайлов в трёх категориях (DSL — Camel core / Citeck-domain / External integrations) | ✅ |
| §3 | Click на тайл → modal закрывается, шаг появляется в YAML и **рисуется на канвасе без `Apply to canvas`** (auto-remount); sidebar сбрасывается — задокументировано в JSDoc | ✅ |
| §4 | Header в 2 строки, RuntimeSelector скрыт через CSS (testid `runtime-selector-list-dropdown`), inline-styles → `CamelDslEditor.scss` | ✅ |
| §5 | URL `/v2/camel-dsl-editor?new=true` → empty-state, Save disabled до выбора триггера | ✅ |
| §5 | Pick `ecos-event:record-status-changed` → канвас рисует `from`-ноду, Save enabled, можно добавлять шаги через палитру | ✅ |
| §5 | Save → создаётся запись через `Records.get('integrations/camel-dsl@')`, URL обновляется на recordRef без full-reload, последующий Save идёт по update-path | ✅ |
| §5 | Reload по новому URL'у с recordRef → грузит маршрут как обычный edit-flow | ✅ |
| §6 | Документация обновлена; suggestion-provider для `{{ecos-secret:...}}` / `{{ecos-endpoint:...}}` зафиксирован как post-MVP в `kaoto-integration-plan.md §8a`; check-in T+2 месяца — там же §8 п.8 | ✅ |

### Связь в трекере

- Эпик: COREDEV-208 — Integrate Kaoto Camel DSL editor into ecos-ui.
- Story: COREDEV-209 — Finalize Kaoto MVP: native property form, start palette, new-mode, layout polish (`epicLink → COREDEV-208`).
