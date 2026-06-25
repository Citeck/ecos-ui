# План интеграции Kaoto в Citeck — оставшиеся работы

Что осталось сделать по интеграции Kaoto. Стабильная архитектура и требования — в [kaoto-architecture.md](./kaoto-architecture.md); выполненный объём (этапы −1…3 + palette consolidation + round-trip) — в [completed/kaoto-mvp-delivered.md](./completed/kaoto-mvp-delivered.md). Индекс папки — [README.md](./README.md). Эпик — COREDEV-208.

> **Статус (2026-06-18):** MVP реализован и задеплоен в прод. **Скоуп MVP = read-only** (просмотрщик: YAML-правка в Monaco + канвас-превью + click-to-source). Этапы −1…1 закрыты, этап 2 функционально завершён, этап 3 частично (journal-экшены). Визуальное редактирование с записью из канваса (флаг ON) вынесено в **COREDEV-312**. Ниже — реальный остаток MVP.

## Что осталось для работающего MVP (read-only)

Просмотрщик уже работает; остаток — про доверие и процесс, не про функции.

1. ✅ **Приёмочный чек-лист флага OFF на стенде** ([kaoto-visual-editing-flag.md](./kaoto-visual-editing-flag.md)) — **пройден 2026-06-18** на local `tdcuosa` (пп.1–3,5,6): канвас read-only, дефолт `split`, edit-контролы подавлены (Tier 0/1), click-to-source (клик по ноде → подсветка строки Monaco), невалидный YAML не роняет канвас, network/консоль чисты.
2. ✅ **Permission-check** — **подтверждено 2026-06-18** (анализ кода): новый редактор использует тот же `sourceId integrations/camel-dsl` и стандартный Records API (`Records.get().load()/.att(content).save()`), что и существующая ACE-форма; журнал в меню admin-workspace (видим только `ECOS_ADMINISTRATORS`); запись гейтится `DefaultDbPermsComponent` (+ явный `perms.checkWrite()` в `CamelDslService` для start/stop). Редактор НЕ обходит ACL. Нюанс: `queryPermsPolicy: PUBLIC` на чтение — предсуществующее свойство типа `ecos-camel-dsl`, не введено редактором.
3. **Этап 6 — тесты, доки, i18n (под read-only):**
   - ✅ **Юнит-тесты маппинга click-to-source** (`yamlLineMap`/`kaotoNodeId`/`monacoLineReveal` + сквозной пайплайн `clickToSourcePipeline.test.js`, зеркалящий `handleNodeSelect`): 283 теста в suite ModelEditor зелёные (+17 новых, 2026-06-18). Добавлены edge-кейсы `doTry`/`split`/пустые `steps` и guard-ветки (ребро/неизвестная нода/невалидный YAML → clear).
   - ✅ **Playwright e2e click-to-source** — проверен вживую через Playwright MCP (2026-06-18) на маршрутах `gitlab-commits-sync` и `gitlab-merge-requests-sync`: клик по ноде → подсветка нужной строки Monaco, форма не открывается. В репо нет e2e-харнесса — сценарий зафиксирован как воспроизводимый runbook ([kaoto-visual-editing-flag.md](./kaoto-visual-editing-flag.md) §«E2E runbook»).
   - ✅ **Раздел в ecos-docs** `integration/Camel_DSL/visual_editor.rst` — просмотрщик (read-only, режимы, click-to-source, ограничения, откат к ACE, флаг). Ветка ecos-docs `feature/COREDEV-208-camel-dsl-visual-editor-docs`.
   - ✅ **i18n строк редактора** — `CamelDslEditor.jsx`/`KaotoModeler.jsx` переведены на `t('camel-dsl-editor.*')`, ключи добавлены в `en.json`/`ru.json` (заголовок, режимы, бейдж, Save/Loading/Error/empty-state, recordRef-плейсхолдеры, resize aria). Проверено вживую на ru-локали (2026-06-18): «Редактор Camel DSL», «Визуальный/Сплит/YAML», «просмотр (только чтение)», «Сохранить». ON-строки (Apply/Take/divergence) — в COREDEV-312.

## Вынесено в COREDEV-312 (визуальное редактирование, флаг ON)

Полноценная запись из канваса обратно в YAML за флагом `camel-visual-editing-enabled` = ON — отдельная story. Детали — в [kaoto-visual-editing-flag.md](./kaoto-visual-editing-flag.md).

- **Этап 4 (round-trip):** баннер «визуальное редактирование удалит YAML-комментарии» (детект `^\s*#`, non-blocking); спот-чек идемпотентности на 2–3 разнотипных маршрутах (`ecos-event`-триггер, `gitlab-*-sync`, `choice/when`); known-limitations (auto-id, потеря комментариев) в ecos-docs.
- **Этап 5 — стратегия раскатки:** kill-switch `camel-visual-editing-enabled`, канареечный rollout (dogfooding → 1–2 пилота → общий релиз), Visual не дефолт на 1–2 минора. Пилот-заказчики — открытый вопрос.
- **Полный регресс round-trip** (см. ниже) + юнит-тесты YAML export + e2e edit→save.

## Опционально / по необходимости

- **Этап 3 (in-editor toolbar)** — кнопки Run/Stop + индикатор `STARTED/STOPPED/SUSPENDED/ERROR` + лог-панель (polling `EcosSyncLog`) + step-highlight при ошибке. Журнал уже покрывает start/stop/logs, поэтому опционально.
- **Этап 1 — ownership-процесс (§1.3):** при добавлении компонента в `ecos-camel` — PR в catalog-overrides + sync-таск в спринт `ecos-ui`. Орг. процесс, не код.

## Мелкие активные задачи

- [kaoto-ecos-event-suggestions.md](./kaoto-ecos-event-suggestions.md) — динамические suggestions для `ecos-event.eventName` (5→8 standard + user-events из `uiserv/action`).
- [kaoto-canvas-pan-navigation.md](./kaoto-canvas-pan-navigation.md) — wheel/keyboard pan канваса (как в BPMN).
- Suggestion-провайдеры для placeholder'ов `{{ecos-secret:<id>/<field>}}` / `{{ecos-endpoint:<name>/<field>}}` в `CiteckSuggestionsBootstrap` (под-пункт palette-consolidation §3.3, ~2 ч).
- **COREDEV-282** — Redux-connect страницы `CamelDslEditor` (паритет с BPMN), **отложен как опциональный** (tab-title решён через `PageService.getTitle`, страница работает).

## Открытые вопросы для команды

1. **React 19 в `ecos-ui`** — когда апгрейд? Определяет, как долго сидим на Kaoto 2.9.x (2.10+ требует React 19).
2. **Air-gap инсталляции** — есть ли заказчики без интернета? (Kaoto + каталог + иконки + шрифты должны быть offline-self-contained.)
3. **Owner каталога Citeck-расширений** — какая команда сопровождает overrides/allowlist при изменениях `ecos-camel`.
4. **Доступ к production-маршрутам** для расширенного регресс-теста (§4 полный прогон) — NDA / sandbox / dev-стенд?
5. **Ru-локализация Kaoto** — критично или en-only + русская дока?
6. **Связка с `ecos-ai`** (post-MVP) — приоритет AI-генерации маршрута?
7. **Pilot-заказчики** — кого зовём на канареек (блокер этапа 5, если делаем rollout).
8. **`ecos-secret` PropertiesFunction** — верифицировать существование в `ecos-camel-core` (для §3.3 suggestion-провайдера; `ecos-endpoint` подтверждён).
9. **Фильтрация версий Camel-каталога** в prod-сборке (~50 MB все версии) — оставлять только 4.14.x через `cpSync`-фильтр (экономия диска; 403 уже исправлен).

## Полный регресс round-trip (COREDEV-312, не часть read-only MVP)

Относится к визуальному редактированию (запись из канваса). Когда появится доступ к prod-маршрутам: выгрузить все `integration/camel-dsl`, прогнать import/export, отчёт по двум сценариям. Acceptance-таргеты: идемпотентный round-trip 100% (стартуют без правок), round-trip с правкой ≥95% (остальное — баннер «доступно только в YAML»). Diff в журнале: пометка `[visual-edit]` + опц. «формальный diff» (игнор whitespace/порядка ключей).

## Открытые риски

| Риск | Митигация |
|---|---|
| Kaoto застрял на 2.9.0 до миграции `ecos-ui` на React 19 | Принимаемо; отдельный track React 19; при апгрейде — переход на latest Kaoto. |
| Конфликт Monaco (`^0.55.1` vs `^0.50.0`) / Bootstrap ↔ PatternFly / i18next | Шипнуто в прод без блокеров; при регрессиях — dedup через `resolutions` / scoped CSS / изоляция i18n-провайдера. |
| Каталог Citeck отстаёт от `ecos-camel` | Ownership-процесс (§1.3); долгосрочно — автогенерация из аннотаций (post-MVP). |
| Потеря YAML-комментариев при канвас-правке | Баннер (этап 4); diff-merge — post-MVP. |
| `RouteVisualization` ломается на минор-bump'е Kaoto | Контракт стабилен с 2.5.x; пин точной версии; запас — миграция на iframe (post-MVP). |

(Решённые риски — Patch A cycle, auto-id, yarn TLS, SCSS pipeline, embed-API, catalogUrl 403 — см. [delivered](./completed/kaoto-mvp-delivered.md).)

## После MVP

> **Был immediate-next-step:** palette consolidation — ✅ выполнено ([completed](./completed/kaoto-palette-consolidation.md)).

1. **AI-помощник** (`ecos-ai`): «опиши маршрут на естественном языке» → YAML.
2. **Dry-run** — sandbox-Camel-контекст без побочных эффектов.
3. **Шаблоны маршрутов** — каталог типовых сценариев.
4. **Метрики и журнал срабатываний** — дашборд.
5. **Связка с ECA-редактором** (`workspace-ctk/docs/automation-editor-options.md`, репозиторий project-docs) — ECA компилируется в Camel YAML, «Convert to Camel» открывает в Kaoto.
6. **Catalog auto-generation** из аннотаций `@UriEndpoint` в `ecos-camel` (вместо ручной синхронизации `components.json` + `allowlist.json`).
7. **Diff-merge для round-trip** — перенос комментариев/форматирования при визуальном редактировании.
8. **Bean-picker** для полей `format: "bean:<javaFQN>"` (autocomplete по `Records.queryAll` + AJV format registration). Зависит от suggestion-механизма §3.3. Подсказывает/подставляет *ссылку* на бен в свойстве шага; **декларацию `beans:` не создаёт**.
9. **Своя beans-панель поверх контракта `code`/`codeChange`** — средний путь между bean-picker (п.8) и iframe-миграцией (п.10). Собственная React-форма рядом с режимами `split`/`yaml`: читает/пишет секцию `beans:` (`name`/`type`/`properties`) того же YAML, изменения идут через тот же `onChange`/`codeChange`. Не требует внутренних API Kaoto (`addStep`/`EntitiesContext`) — оперирует YAML, которым мы владеем. Закрывает «создать декларацию бена в UI», чего не дают ни picker (только ссылки), ни текущий MVP (только руками в Monaco). Оценка: ~несколько дней на v1 (плоские строковые `properties` + raw-YAML escape-hatch для вложенных). **Риски:** (а) feedback-loop пересева канваса — пускать правки через `canvasSeed`/Apply-дисциплину, как в фиксе `36fe3a954`; (б) потеря комментариев в `beans:` при round-trip — точечный edit узла либо принять; (в) валидация `type` — FQN без каталога, дропдаун известных Citeck-процессоров (`GetRecordAttsProcessor`, `HmacSignatureProcessor`, …) + свободный ввод (стыкуется с п.8). **Минус:** собственный surface на поддержку, частичное дублирование с нативным Beans-вью при будущей iframe-миграции (п.10). Первый драйвер потребности — бен `HmacSignatureProcessor` (COREDEV-287) для подписи Mango-запросов.
10. **Миграция embedding на `multiplying-architecture` / `KaotoEditorFactory`** (iframe + KIE Tooling Bridge, 3–6 недель). Даёт родную палитру-sidebar, 5 режимов вставки, public-API hooks (`getSuggestions`/`onStepUpdated`/`getResourcesContentByType`), стабильность. Цена: реализация `KaotoEditorChannelApi` (15+ методов), iframe lifecycle, проброс auth/тема/locale (прецедента в `ecos-ui` нет), CSS-изоляция, env-config деплоя. **Триггеры для старта:** (а) фидбек требует palette-sidebar/suggestion-API, а MVP-имплементации мало; (б) Kaoto обогащает `KaotoEditorChannelApi`, но не `RouteVisualization`; (в) ломается `RouteVisualization`-контракт на bump'е; (г) появляется второй потребитель Kaoto в `ecos-ui`. Check-in T+2 месяца после релиза MVP.
11. ✅ **Click-to-source: клик по ноде канваса → переход к строке YAML в Monaco** — навигация для read-only-`split`-превью. Спайк выполнен и подтверждён на стенде (формат id = `` `${entityId}|${modelPath}` ``, `modelPath` 1:1 = наш `dslPath`). **Реализовано (задачи `CTS-1…CTS-6`) → [kaoto-visual-editing-flag.md](./kaoto-visual-editing-flag.md) §«Расширение: Click-to-source навигация».** Утили `yamlLineMap.js` (`pathId → line`), `kaotoNodeId.js` (id ноды → `pathId`), `monacoLineReveal.js` (reveal + decoration); связка `SELECTION_EVENT → kaotoNodeIdToPathId → buildPathLineMap → revealLine` в `KaotoModeler`, активна только при `visualEditingEnabled === false`. Оценка ~1 день.
