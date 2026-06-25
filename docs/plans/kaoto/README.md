# Kaoto integration — индекс документов

Интеграция визуального редактора Apache Camel-маршрутов ([Kaoto](https://kaoto.io), компонент `@kaoto/kaoto` 2.9.0) в `ecos-ui` рядом с текстовым YAML-редактором. Backend-исполнение в `ecos-integrations` не меняется — формат Camel YAML DSL тот же. Эпик COREDEV-208, story COREDEV-209.

> **Скоуп MVP (COREDEV-208) = read-only.** MVP — это *просмотрщик*: правка маршрута в YAML-режиме (Monaco) + канвас как «живое превью» + click-to-source (клик по ноде → подсветка строки YAML). Полноценное **визуальное редактирование** с записью из канваса обратно в YAML (флаг `camel-visual-editing-enabled` = ON) вынесено в отдельную story **COREDEV-312**.

Стратегический контекст (зачем Kaoto и как он соотносится с ECA-редактором) — в `workspace-ctk/docs/automation-platform-analysis.md` и `automation-editor-options.md` (отдельный репозиторий project-docs). Kaoto = Этап 1 «слоистого подхода».

## Структура

- **[kaoto-architecture.md](./kaoto-architecture.md)** — архитектура и требования (стабильное «что и как»: контракт `RouteVisualization`, целевая архитектура, совместимость, ограничения).
- **[kaoto-yarn-patches.md](./kaoto-yarn-patches.md)** — yarn-патчи Kaoto (`@kaoto/kaoto` ×2 + `@kaoto/forms`): что/зачем каждый, layering, процедура re-apply при bump'е.
- **[kaoto-integration-plan.md](./kaoto-integration-plan.md)** — оставшиеся работы, открытые вопросы, post-MVP.
- **[completed/kaoto-mvp-delivered.md](./completed/kaoto-mvp-delivered.md)** — реестр выполненного (статус этапов + что сделано + ссылки на детальные доки).

## Активные документы (есть незакрытая работа)

| Документ | О чём | Статус |
|---|---|---|
| [kaoto-integration-plan.md](./kaoto-integration-plan.md) | Оставшиеся работы (read-only MVP) + открытые вопросы + post-MVP | 🟡 MVP (read-only) в проде; остаток — приёмочный чек-лист флага OFF на стенде + permission-check + этап 6 (тесты/доки/i18n под read-only). Визуальное редактирование → COREDEV-312 |
| [kaoto-visual-editing-flag.md](./kaoto-visual-editing-flag.md) | Флаг `camel-visual-editing-enabled` (ecos-config, default off): OFF → YAML+read-only-превью в split (**это и есть MVP**); ON → визуальное редактирование (**COREDEV-312**) | 🟢 Read-only-часть (OFF) готова (Tasks 1–8 + CTS-1…6, 2026-06-08): флаг в ConfigService, read-only канвас + авто-ресид, дефолт `split` в OFF, подавление edit-контролов (Tier 0/1), click-to-source (клик по ноде → скролл/подсветка строки Monaco); build зелёный. **Приёмочный чек-лист OFF — ✅ пройден на стенде 2026-06-18** (пп.1–3,5,6). Доведение ON-режима → COREDEV-312 |
| [kaoto-ecos-event-suggestions.md](./kaoto-ecos-event-suggestions.md) | Динамические suggestions для `ecos-event.eventName` (5→8 standard + user-events из `uiserv/action`) | 🔴 Pending — `STANDARD_EVENT_TRIGGERS` всё ещё 5 значений, `queryUserEvents()` не реализован |
| [kaoto-canvas-pan-navigation.md](./kaoto-canvas-pan-navigation.md) | Wheel-pan + keyboard-навигация по канвасу (как в BPMN) | 🔴 Pending — нужен спайк, патча `usePanZoom` нет |

## Завершённые документы ([completed/](./completed/))

| Документ | О чём | Закрыто |
|---|---|---|
| [kaoto-mvp-delivered.md](./completed/kaoto-mvp-delivered.md) | **Реестр выполненного** — статус этапов + что сделано по областям | ✅ сводка |
| [kaoto-mvp-finalization.md](./completed/kaoto-mvp-finalization.md) | Финализация MVP: формы, палитра, new-mode, layout | ✅ 2026-04-28 |
| [kaoto-cycle-investigation.md](./completed/kaoto-cycle-investigation.md) | Расследование и фикс Maximum-update-depth цикла (Patch A) | ✅ 2026-04-28 |
| [kaoto-mvp-ux.md](./completed/kaoto-mvp-ux.md) | MVP с точки зрения пользователя (info) | ✅ 2026-04-28 |
| [2026-04-28-kaoto-palette-consolidation-impl.md](./completed/2026-04-28-kaoto-palette-consolidation-impl.md) | Implementation-чек-лист консолидации палитры (Task 1–21) | ✅ 2026-04-29 |
| [kaoto-palette-consolidation.md](./completed/kaoto-palette-consolidation.md) | Design: единая палитра (нативный Kaoto + Citeck-preset + 20 схем + allowlist) | ✅ 2026-04-29 (остаток: §3.3 secret/endpoint placeholders) |
| [kaoto-palette-consolidation-3-0-acceptance.md](./completed/kaoto-palette-consolidation-3-0-acceptance.md) | Acceptance §3.0: verification pass 20 Citeck-overrides | ✅ 2026-04-29 |
| [kaoto-catalog-extension.md](./completed/kaoto-catalog-extension.md) | Механизм overrides + allowlist в `serveCamelCatalogPlugin` | ✅ 2026-04-29 |
| [kaoto-catalog-prod-deploy.md](./completed/kaoto-catalog-prod-deploy.md) | Фикс 403 каталога в prod (+ layout) | ✅ 2026-04-29 |

## Пост-MVP фиксы (журнал)

| Коммит | Дата | Фикс | Документ |
|---|---|---|---|
| `024337b2e` | 2026-04-29 | 403 на `/camel-catalog/` в проде + collapsed height + page overflow | [catalog-prod-deploy](./completed/kaoto-catalog-prod-deploy.md) |
| `8a69d8b0f` | 2026-04-29 | Structured form для Citeck endpoints (`ecos-event` Map+Predicate), фикс `[object Object]` | [3-0-acceptance](./completed/kaoto-palette-consolidation-3-0-acceptance.md) §3.0 |
| `de5410272` | 2026-04-29 | Осмысленный заголовок вкладки для Camel DSL-редактора | — (chrome polish) |
| `36fe3a954` | 2026-06-04 | **Критический:** панель свойств закрывалась после первого символа при правке свойства ноды (`id` и др.). Причина — feedback-loop: эмиссия канваса (`entities:updated` → `codeChange`) скармливалась обратно в prop `code` того же `RouteVisualization` → перевыпуск `code:updated` → `EntitiesProvider` пересоздавал `CamelResource` → выделение и открытая форма уничтожались. Фикс — расщепление `canvasYaml` на seed-prop `canvasSeed` (меняется только при mount/Apply) и трекер расхождения. | — (KaotoModeler.jsx; регресс-тест в `KaotoModelerCanvasMonacoSync.test.js`) |

## Что осталось сделать

Подробно — в [kaoto-integration-plan.md](./kaoto-integration-plan.md). **MVP = read-only**, поэтому остаток сужен.

1. **Для MVP (read-only):** ✅ приёмочный чек-лист флага OFF на стенде (2026-06-18); ✅ permission-check (2026-06-18 — тот же source/Records API/ACL, что ACE; журнал в admin-workspace).
2. **Этап 6 (под read-only):** ✅ юнит-тесты маппинга click-to-source (+пайплайн, 283 теста зелёные); ✅ Playwright e2e click-to-source проверен вживую (2026-06-18, `gitlab-commits-sync` + `gitlab-merge-requests-sync`); ✅ ru-документация про просмотрщик (ветка ecos-docs `feature/COREDEV-208-camel-dsl-visual-editor-docs`); ✅ i18n строк редактора (`camel-dsl-editor.*` в en/ru, проверено на ru-локали). **Этап 6 read-only закрыт.**
3. **Мелочи (post-MVP, актуальны и в read-only — YAML правится в Monaco):** event-suggestions (динамика), suggestion-провайдеры `{{ecos-secret/endpoint}}`, canvas pan-navigation.

**Вынесено в отдельные задачи:**
- **COREDEV-312** — визуальное редактирование (флаг ON): round-trip + баннер про комментарии + этап 5 rollout + in-editor Run/Stop toolbar + полный регресс round-trip.
- **COREDEV-282** — Redux-connect страницы (паритет с BPMN, опционально).
