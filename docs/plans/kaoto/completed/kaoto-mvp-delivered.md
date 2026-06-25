# Kaoto MVP — доставленный объём (этапы −1…3 + palette consolidation + round-trip verified)

Реестр выполненного по интеграции Kaoto. Архитектура — [../kaoto-architecture.md](../kaoto-architecture.md); оставшиеся работы — [../kaoto-integration-plan.md](../kaoto-integration-plan.md). Детальные планы по каждому куску — в этой папке `completed/` (ссылки ниже).

**Итог:** MVP визуального Camel-редактора реализован и **задеплоен в прод** — standalone-страница `/v2/camel-dsl-editor`, режимы Visual / Split / YAML, открытие из журнала.

## Статус этапов

| Этап | Статус | Детали |
|---|---|---|
| −1. Scaffold в `ecos-ui` | ✅ | структура файлов + lazy-маршрут `/v2/camel-dsl-editor` |
| −0.5. Kaoto deps + vite + KaotoModeler | ✅ | `@kaoto/kaoto` 2.9.0 + 10 deps, `serveCamelCatalogPlugin`, split-layout |
| −0.4. Catalog resolver + property forms | ✅ | нативный `CanvasSideBar` + каталог-санитайзер `type:enum`→`string` |
| 0. Валидационный спайк | ✅ | embed-API подтверждён, bundle/lazy замерены, go |
| 0b. React 18.2 → 18.3 | ✅ | пин Kaoto 2.9.0, install без `--legacy-peer-deps` |
| Patch A (cycle fix) | ✅ | см. ниже + [kaoto-cycle-investigation.md](./kaoto-cycle-investigation.md) |
| MVP finalization | ✅ | [kaoto-mvp-finalization.md](./kaoto-mvp-finalization.md), UX — [kaoto-mvp-ux.md](./kaoto-mvp-ux.md) |
| Palette consolidation | ✅ | [kaoto-palette-consolidation.md](./kaoto-palette-consolidation.md) + [impl](./2026-04-28-kaoto-palette-consolidation-impl.md) + [acceptance](./kaoto-palette-consolidation-3-0-acceptance.md) |
| 1. Каталог Citeck-компонентов | ✅ | 20 схем + allowlist; остаётся орг. ownership-процесс (план §1.3) |
| 2. KaotoModeler integration | ✅ функц. | split + формы + палитра + entry-point; Redux-connect отложен → COREDEV-282 |
| 3. Run / Stop / Logs | 🟡 частично | journal-экшены готовы; in-editor toolbar — опц. |
| 4. Round-trip safety | ✅ проверено | идемпотентный round-trip чистый; auto-id не блокер; comment-loss — known-limitation |

## Что реализовано — по областям

### Редактор и синхронизация
- `KaotoModeler` оборачивает `RouteVisualization` (uncontrolled-pattern, `key`-remount при смене источника).
- Split-layout: канвас ↔ Monaco YAML. Canvas→Monaco live; Monaco→canvas — ручной «Apply to canvas». `viewMode`: visual/split/yaml.
- Records API: load `content/state/name`, save через `record.att('content', yaml).save()`. New-mode `?new=true` (Trigger-picker → initial YAML → создание записи, sentinel-`key`).

### Property-формы
- Единственная форма — нативный Kaoto `CanvasSideBar` (`@kaoto/forms` `KaotoForm`), схемы из каталога. Свои `StepForm`/`StepPicker`/`catalogResolver`/`citeckSchemas` удалены.
- Expression-picker (Simple/Constant/CSimple/JSONPath/...) — из коробки.
- Каталог-санитайзер в `serveCamelCatalogPlugin`: `type:"enum"`→`"string"` (912 свойств; иначе AJV падал).
- Структурные формы Citeck-эндпоинтов (`ecos-event` Map+Predicate) — фикс `[object Object]` (коммит `8a69d8b0f`), + yarn-патч `@kaoto/forms`. См. [acceptance §3.0](./kaoto-palette-consolidation-3-0-acceptance.md).

### Каталог
- `public/camel-catalog-overrides/components.json` — 20 ecos-camel-core схем (8 core + 12 addons), extension-merge в `serveCamelCatalogPlugin`.
- `public/camel-catalog-overrides/allowlist.json` — 37 Apache-Camel схем; фильтр через `vite-plugins/camelCatalogAllowlist.js` (`loadComponentAllowlist`), применяется до overrides. Hot-reload `fs.watch`.

### Палитра (consolidation)
- Своя палитра (`AddStepButton`/`AddStepModal`/`addStepTiles`) удалена в пользу нативного Kaoto «+ Add step».
- Preset тега `citeck` (yarn-патч `Catalog.js` + `CiteckCatalogModalProvider`).

### Suggestion-провайдеры (`CiteckSuggestionsBootstrap`)
- `citeck-record-type` (recordType/typeRef → emodel/type), `citeck-event-trigger` (eventName → 5 standard), `citeck-source-id` (sourceId → emodel/src). TTL-кэш 30с.

### Entry-point и Run/Stop/Logs (`ecos-integrations`)
- `ui/action/cameldsl/open-camel-dsl-editor.yml` (`open-url` → `/v2/camel-dsl-editor?recordRef=`) — подключён в тип `ecos-camel-dsl` и журнал.
- `start-camel-dsl` / `stop-camel-dsl` (`mutate` `state`) + `view-sync-logs` — journal-экшены.

### Prod-фиксы
- 403 каталога в проде: дефолт `catalogUrl = /camel-catalog/index.json` + layout (collapsed height / page overflow) — коммит `024337b2e`. См. [kaoto-catalog-prod-deploy.md](./kaoto-catalog-prod-deploy.md).
- Осмысленный заголовок вкладки через `PageService.getTitle` — коммит `de5410272`.
- `PageService.js` optional-chain `closest?.` — фикс краша на synthetic SVG-events PatternFly Topology.

## Patch A — Maximum-update-depth cycle (устранён)

**Root cause:** в `@kaoto/kaoto@2.9.0` `RouteVisualization.tsx` — `useEffect` зависит от собственного output (reducer `showFlows` всегда возвращает новый объект) → бесконечный цикл. Мы — первые, кто встраивает напрямую через `RouteVisualization` (их demo рендерит `<App>`).

**Фикс:** Patch A (identity-preserving reducer для `showFlows`/`hideFlows`), `.yarn/patches/@kaoto-kaoto-npm-2.9.0-656f79ef19.patch`.

| Метрика | До | После | 
|---|---:|---:|
| `mut/sec` | 1141 | 0.20 |
| `cycle/sec` | 3.4 | 0 |
| `mobx events/sec` | 24 236 | 2 |

Property-panel / drag-drop / Add step / selection — заработали. StrictMode совместим. Полная история — [kaoto-cycle-investigation.md](./kaoto-cycle-investigation.md). **TODO upstream:** PR в KaotoIO/kaoto.

## Round-trip — проверено (2026-06-03)

- **Идемпотентный** (без правок / правки в YAML-режиме): **чистый** — synthetic `route-XXXX` в YAML не пишется, комментарии/текст сохраняются (Monaco — текстовый source-of-truth).
- **С правкой в канвасе:** Kaoto ре-сериализует модель →
  - у id-less маршрута `route-xxxx` добавляется **однократно** (далее стабилен) — **accepted known-limitation** (разработчик переименует);
  - **YAML-комментарии теряются** (подтверждено на `default-import-data.yml`) — mitigation: баннер (план §4.2).

→ auto-id **не блокер**. Нормализация diff не нужна.

## yarn-патчи (сопровождать при bump'ах Kaoto)
- `@kaoto-kaoto-npm-2.9.0-656f79ef19.patch` — Patch A (cycle) + `initialFilterTags` prop.
- `@kaoto-forms-npm-1.7.2-object-value-display.patch` — defense JSON.stringify для object-values.
