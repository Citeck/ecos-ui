# Kaoto catalog extension — fixation §1 spike

> **✅ Реализовано (2026-04-29).** `vite-plugins/camelCatalogAllowlist.js` (`loadComponentAllowlist()`), `public/camel-catalog-overrides/allowlist.json` (37 схем) и allowlist-фильтр в `serveCamelCatalogPlugin` — коммиты `4a9c0598f`, `2e6874e99`, `1729b0eec`. Документ — описание механизма (fixation).

Подтверждение [kaoto-mvp-finalization.md §1](./kaoto-mvp-finalization.md). Mechanism injection — extension-merge в существующий `serveCamelCatalogPlugin` (`vite.config.js`).

## Mechanism

`serveCamelCatalogPlugin` обрабатывает aggregate-components файлы Camel-каталога двумя симметричными механизмами: **overrides** (добавление Citeck-схем в каталог) и **allowlist** (фильтр стандартных Apache-Camel-схем до только тех, что присутствуют в pom.xml рантайма платформы). Allowlist применяется **до** overrides — Citeck-схемы попадают в каталог независимо от allowlist'а.

### Overrides (`components.json`)

- **Source-of-truth:** `public/camel-catalog-overrides/components.json` в формате aggregate-components (top-level keys = `scheme`).
- **Регекс файлов под merge:** `/aggregate-components(?:-[0-9a-f]+)?\.json$/` — матчит и `*-aggregate-components-<hash>.json` (camel-main runtime'ы), и потенциально безхешевые имена.
- **Merge:** `Object.assign(parsed, overrides)` — shallow, добавляет новые top-level ключи, не переопределяет существующие.
- **Точки применения:**
  1. `serveCamelCatalogPlugin.readSanitized` (dev middleware, `/camel-catalog/...`) — после `sanitizeCatalogJsonInPlace` и после allowlist-фильтра, до возврата буфера.
  2. `serveCamelCatalogPlugin.writeBundle` (prod-сборка, walk по `build/camel-catalog/`) — тот же merge при перезаписи каждого aggregate-components-файла.
- **Hot-reload:** `fs.watch` на `components.json`. На изменение — перечитывается overrides + чистится `sanitizedCache` для всех закэшированных aggregate-components-файлов (общий helper `invalidateAggregateCache()`). Следующий запрос middleware смерджит свежие данные.

### Allowlist (`allowlist.json`)

- **Source-of-truth:** `public/camel-catalog-overrides/allowlist.json` в формате `{ "components": ["direct", "log", "file", ...] }` плюс header-`_comment` для документации происхождения.
- **Содержимое выводится из реального рантайма:** `<artifactId>camel-*</artifactId>` в `pom.xml` микросервисов `ecos-integrations` / `ecos-edi` / `ecos-camel` + builtin'ы `camel-core` (37 entry на 2026-04-29). Citeck-схемы в allowlist **не** включаются — они приходят через overrides и не подвластны allowlist'у.
- **Helper:** `loadComponentAllowlist(filePath)` (вынесен в `vite-plugins/camelCatalogAllowlist.js`, чтобы быть testable от Jest вне vite-окружения) — возвращает `Set<string>` или `null` (при отсутствии файла, malformed JSON или wrong-shape — фильтр **не применяется**, safe-default backward-compatibility).
- **Применение:** в `readSanitized` и в `writeBundle.walk` — `for (const name of Object.keys(parsed)) if (!componentAllowlist.has(name)) delete parsed[name]` ДО `Object.assign(parsed, componentOverrides)`. Порядок гарантирует, что Citeck-схемы (через overrides) всегда в каталоге.
- **Hot-reload:** второй `fs.watch` на `allowlist.json`, перечитывает allowlist + общий `invalidateAggregateCache()` helper (тот же, что и для overrides). Следующий запрос middleware видит свежий список.

### Соседство файлов

В одной директории `public/camel-catalog-overrides/`:

```
camel-catalog-overrides/
├── components.json   ← overrides (20 Citeck-схем после consolidation'а: 8 core + 12 addons)
└── allowlist.json    ← фильтр Apache-Camel схем (37 entry)
```

Тестовое покрытие — `__tests__/catalogOverridesComponents.test.js`, `__tests__/catalogAllowlist.test.js`, `__tests__/loadComponentAllowlist.test.js`.

## Snippet `public/camel-catalog-overrides/components.json` (entry для ecos-event)

```json
{
  "ecos-event": {
    "component": {
      "kind": "component",
      "name": "ecos-event",
      "title": "Citeck Event",
      "description": "Citeck event trigger / publisher. Используется в from: для подписки на события записей и в to: для публикации событий в шину Citeck. Точное событие задаётся в path-сегменте URI: ecos-event:<eventName>.",
      "label": "citeck,event",
      "javaType": "ru.citeck.ecos.camel.events.EcosEventComponent",
      "supportLevel": "Stable",
      "groupId": "ru.citeck.ecos",
      "artifactId": "ecos-camel-core",
      "version": "1.0.0",
      "scheme": "ecos-event",
      "syntax": "ecos-event:eventName",
      "provider": "Citeck"
    },
    "componentProperties": {},
    "properties": {
      "eventName": { "kind": "path", "required": true, "type": "string", "description": "..." },
      "recordType": { "kind": "parameter", "type": "string", "description": "..." },
      "typeRef": { "kind": "parameter", "type": "string", "description": "..." },
      "attributes": { "kind": "parameter", "type": "string", "description": "..." }
    },
    "propertiesSchema": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["eventName"],
      "properties": {
        "eventName": { "title": "Event name", "type": "string", "$comment": "group:common", "description": "..." },
        "recordType": { "title": "Record type", "type": "string", "$comment": "group:common", "description": "..." },
        "typeRef": { "title": "Type ref", "type": "string", "$comment": "group:common", "description": "..." },
        "attributes": { "title": "Attributes", "type": "string", "$comment": "group:common", "description": "..." }
      }
    }
  }
}
```

(полный файл — в `public/camel-catalog-overrides/components.json` с development descriptions для каждого свойства и полным набором `index/kind/javaType/...`-полей под формат aggregate-components)

## Diff `vite.config.js`

```diff
-import { cpSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
+import { cpSync, existsSync, readdirSync, readFileSync, statSync, watch as fsWatch, writeFileSync } from 'fs';

+const COMPONENT_OVERRIDES_FILE = path.resolve(__dirname, 'public/camel-catalog-overrides/components.json');
+const AGGREGATE_COMPONENTS_REGEX = /aggregate-components(?:-[0-9a-f]+)?\.json$/;
+
+function loadComponentOverrides() {
+  if (!existsSync(COMPONENT_OVERRIDES_FILE)) return {};
+  try { return JSON.parse(readFileSync(COMPONENT_OVERRIDES_FILE, 'utf-8')); }
+  catch (e) { console.warn('[serve-camel-catalog] failed to parse component overrides:', e.message); return {}; }
+}

 function serveCamelCatalogPlugin() {
   ...
+  let componentOverrides = loadComponentOverrides();
+
   const readSanitized = filePath => {
     ...
     const parsed = JSON.parse(raw);
     sanitizeCatalogJsonInPlace(parsed);
+    if (AGGREGATE_COMPONENTS_REGEX.test(filePath)) {
+      Object.assign(parsed, componentOverrides);
+    }
     buf = Buffer.from(JSON.stringify(parsed));
     ...
   };
+
+  const watchOverrides = () => {
+    if (!existsSync(COMPONENT_OVERRIDES_FILE)) return;
+    try {
+      fsWatch(COMPONENT_OVERRIDES_FILE, () => {
+        componentOverrides = loadComponentOverrides();
+        for (const key of sanitizedCache.keys()) {
+          if (AGGREGATE_COMPONENTS_REGEX.test(key)) sanitizedCache.delete(key);
+        }
+        console.log('[serve-camel-catalog] component overrides reloaded');
+      });
+    } catch (e) { console.warn('[serve-camel-catalog] fs.watch failed:', e.message); }
+  };

   return {
     configureServer(server) {
       server.middlewares.use('/camel-catalog', catalogMiddleware);
+      watchOverrides();
     },
     ...
     writeBundle(options) {
+      const overrides = loadComponentOverrides();
       const walk = dir => {
         ...
         sanitizeCatalogJsonInPlace(parsed);
+        if (AGGREGATE_COMPONENTS_REGEX.test(fp)) Object.assign(parsed, overrides);
         writeFileSync(fp, JSON.stringify(parsed));
         ...
       };
     }
   };
 }
```

## Server-side проверки (выполнены автоматически)

| # | Проверка | Результат |
|---|---|---|
| 1 | Регекс матчит `camel-catalog-aggregate-components-<hash>.json` | ✅ |
| 2 | `Object.assign` на распарсенный JSON: 361 → 362 ключей | ✅ |
| 3 | `direct` (существующий) не затронут после merge | ✅ |
| 4 | Middleware HTTP-ответ содержит `ecos-event` с правильным `scheme/syntax/required` | ✅ |
| 5 | `fs.watch`: правка `components.json` → следующий запрос видит свежие поля без рестарта vite | ✅ |
| 6 | После restore overrides — добавленный probe удалён, лог `component overrides reloaded` × 2 | ✅ |

## Browser acceptance (требует ручной проверки)

Dev-сервер запущен на `http://localhost:3000`. URL editor'а — `http://localhost:3000/v2/camel-dsl-editor`. Текущий `SAMPLE_YAML` (в `CamelDslEditor.jsx`) уже содержит `from: "ecos-event:record-created"` — открытие страницы без `recordRef` сразу даёт сценарий §1.4-from.

### Сценарий §1.4-from (`from: ecos-event:record-created`)

1. Открыть `http://localhost:3000/v2/camel-dsl-editor`.
2. Ожидание: канвас рисуется без RuntimeProvider error'ов в console. Видна `from`-нода с надписью `ecos-event:record-created`.
3. Клик на `from`-ноду.
4. **Ожидание:** в правом sidebar (родной Kaoto `CanvasSideBar`) открывается форма с заголовком `ecos-event` и полями `Event name` (с заполненным значением `record-created`), `Record type` (заполнено `document`), `Type ref`, `Attributes`. Нет «Schema not found» / fallback на generic-форму.
5. Изменить `Record type` с `document` на `file`.
6. Переключить режим на `Split` или `YAML`. **Ожидание:** в YAML — `parameters: { recordType: file }` (без потери остальных полей, без kamelet-обёртки, без `bean:`-преобразований).
7. Reload страницы (с восстановлением SAMPLE_YAML). **Ожидание:** клик → форма снова показывает заполненные поля без потерь.

### Сценарий §1.4-to (`to: ecos-event:notify`)

1. На той же странице переключить режим на `Split`/`YAML`.
2. Заменить в YAML строку `- to: "log:info"` на `- to: "ecos-event:notify"`.
3. Кликнуть `Apply to canvas`.
4. **Ожидание:** канвас рисует без ошибок, появляется `to`-нода с надписью `ecos-event:notify`.
5. Клик на `to`-ноду.
6. **Ожидание:** `CanvasSideBar` открывает ту же форму `ecos-event` с полями `Event name` = `notify`. Edit любого поля → YAML обновляется как `to: ecos-event:notify?param=...` (или эквивалентный объектный синтаксис), без обёрток.

### Если оба зелёные

- §1 ✅ закрыт.
- В этом файле прикрепить скриншот `CanvasSideBar` с открытой формой `ecos-event` (можно сделать снимок вручную, положить в `docs/plans/img/` или приложить к Citeck Project Tracker issue).
- Перейти к §1.1 — добавить второй entry `ecos-endpoint` в `components.json`. Plugin-логика уже стоит, изменений в `vite.config.js` не требуется.

### Если красный (любой из двух)

- Зафиксировать причину в этом файле (kamelet-wrap / lookup mismatch / round-trip ломается / generic fallback вместо нашей формы).
- §3.0.3 в основном плане переходит в полноценную задачу с эскалацией в Kaoto Zulip / GitHub Discussions.
- §2 и §3 mvp-плана **не делаем** — оставляем `StepForm`/`StepPicker` как есть, переключатель Required/Modified закрываем кастомным `tab=`-prop'ом в `StepForm.jsx`.

## Acceptance via curl (§4 allowlist filter)

После Task 17 (`vite.config.js` + `vite-plugins/camelCatalogAllowlist.js` + `public/camel-catalog-overrides/allowlist.json`) проверка корректности фильтрации делается curl-ом против dev-сервера. Команды ниже воспроизводят acceptance-шаги из Task 18 плана `kaoto-palette-consolidation-impl.md`.

Подготовка:

```bash
yarn start &              # vite-express dev на http://localhost:3000
# подождать "Server is running on http://localhost:3000"
CATALOG_URL="http://localhost:3000/camel-catalog/camel-main/4.14.4/camel-catalog-aggregate-components-7499fb787ad520640e2bf0fa65208ba7.json"
```

Если хеш файла поменялся (после bump'а `@kaoto/camel-catalog`), найти актуальный:

```bash
ls node_modules/@kaoto/camel-catalog/dist/camel-catalog/camel-main/4.14.4/ | grep aggregate-components
```

Пять основных проверок (используют `jq`; если `jq` не установлен — заменить на `node -e 'JSON.parse(...)'`-эквиваленты):

```bash
# 1) количество ключей ≤55 (37 allowlist + 20 Citeck-overrides + запас)
curl -s "$CATALOG_URL" | jq 'keys | length'
# expected: 54 (некоторые allowlist-схемы вроде vm/method/xpath отсутствуют в исходном camel-main 4.14.4 — allowlist фильтрует, но не инжектит)

# 2) ни одной не-разрешённой Camel-схемы
curl -s "$CATALOG_URL" | jq 'has("hazelcast-map") or has("asterisk")'
# expected: false

# 3) все ключевые Citeck-схемы прошли (overrides всегда merge-ится поверх allowlist'а)
curl -s "$CATALOG_URL" | jq 'has("ecos-event") and has("ecos-records-mutate") and has("ecos-attributes-mapper") and has("ecos-excel-stream-read")'
# expected: true

# 4) ключевые Camel allowlist-схемы прошли
curl -s "$CATALOG_URL" | jq 'has("direct") and has("log") and has("file") and has("http") and has("sql") and has("smtp")'
# expected: true

# 5) hot-reload — fsWatch сбрасывает кэш на изменение allowlist.json
cp public/camel-catalog-overrides/allowlist.json /tmp/allowlist.backup
node -e 'const fs=require("fs"),p="public/camel-catalog-overrides/allowlist.json",d=JSON.parse(fs.readFileSync(p,"utf-8"));d.components=d.components.filter(c=>c!=="direct");fs.writeFileSync(p,JSON.stringify(d,null,2)+"\n")'
sleep 1
curl -s "$CATALOG_URL" | jq 'has("direct")'      # expected: false
cp /tmp/allowlist.backup public/camel-catalog-overrides/allowlist.json
sleep 1
curl -s "$CATALOG_URL" | jq 'has("direct")'      # expected: true
```

После проверки — `kill %1` (или Ctrl+C) для остановки dev-сервера.

**Замечание по производительности кэша:** `serveCamelCatalogPlugin` использует `sanitizedCache: Map<filePath, Buffer>`. При hot-reload allowlist'а или overrides'а инвалидируются ВСЕ записи, матчащие `AGGREGATE_COMPONENTS_REGEX` (общий helper `invalidateAggregateCache()`), и следующий HTTP-запрос пересобирает буфер с нуля. То есть смотреть нужно именно ответ middleware'а (curl), а не файл на диске — там source неизменный.
