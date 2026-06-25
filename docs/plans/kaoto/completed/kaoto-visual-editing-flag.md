# Kaoto — флаг визуального редактирования (`camel-visual-editing-enabled`)

Включение визуального редактирования Camel-маршрутов в Kaoto-редакторе через отдельный параметр `ecos-config`, **по умолчанию выключено**. Родительский план — [kaoto-integration-plan.md](./kaoto-integration-plan.md); архитектура — [kaoto-architecture.md](./kaoto-architecture.md). Эпик — COREDEV-208.

> **Статус:** дизайн зафиксирован (2026-06-05); план переведён в исполняемый вид (ralphex, задачи ниже). Владелец ключа решён — `app/integrations$camel-visual-editing-enabled`.
>
> **Исправление (2026-06-08):** токен app в ключе — eureka/webapp-имя `integrations`, а не имя проекта `ecos-integrations` (scope app-config выводится из `webappProps.appName`, ср. `AppName.INTEGRATIONS = "integrations"` и существующий `integrations/cfg@default-import-data-variant-enabled`). Изначальный `app/ecos-integrations$...` не резолвился бы и флаг навсегда оставался бы `false`. Правильный ключ — `app/integrations$camel-visual-editing-enabled` (как `app/alfresco$`, `app/emodel$`, `app/gateway$`).

## Цель и MVP-сценарий

**Базовый сценарий MVP (флаг OFF, дефолт):** разработчик правит YAML в Monaco и **сразу видит отрисованную схему маршрута на канвасе** в режиме `split`. Канвас — «живое превью» (read-only), визуальные мутации не сохраняются.

**Расширенный сценарий (флаг ON):** полноценное визуальное редактирование — drag, «+ Add step», property-формы пишут обратно в YAML (текущее поведение `KaotoModeler` с Apply/Take-flow и дефолтом `visual`).

Флаг даёт kill-switch и канареечную раскатку (см. этап 5 родительского плана), не меняя backend-исполнение.

## Параметр `ecos-config`

| Поле | Значение |
|---|---|
| Ключ | `app/integrations$camel-visual-editing-enabled` (app-config, webapp-владелец — `integrations` / проект `ecos-integrations`) |
| Тип | `BOOLEAN` |
| Default | `false` |

- Формат `app/<app>$<key>` уже поддержан фронтом (`ALFRESCO_ENABLED = 'app/alfresco$alfresco-enabled'`) — читается тем же путём, что остальные feature-флаги. Владение флагом закреплено за `ecos-integrations`.

### Изменения в `ConfigService.js`

```js
// src/services/config/ConfigService.js
export const CAMEL_VISUAL_EDITING_ENABLED = 'app/integrations$camel-visual-editing-enabled';

// в CONFIG_PROPS:
[CAMEL_VISUAL_EDITING_ENABLED]: {
  defaultValue: false,
  type: TYPE_BOOLEAN
}
```

Чтение — `await ConfigService.getValue(CAMEL_VISUAL_EDITING_ENABLED)` (батчится с прочими конфигами, кешируется в localStorage).

## Матрица поведения

| Аспект | OFF (дефолт MVP) | ON |
|---|---|---|
| Дефолтный `viewMode` | `split` | `visual` (как сейчас) |
| Вкладки переключателя | `visual` / `split` / `yaml` — все доступны | все доступны |
| Канвас | **read-only превью** | редактируемый |
| Персистентность мутаций канваса | игнорируются (не пишутся в YAML/Save) | пишутся в YAML через `codeChange` |
| Edit-контролы канваса (верхний тулбар New/Undo/Redo/Copy/Export, «Open Catalog», DnD-перестановка, hover-StepToolbar, «+Add step» на нодах/рёбрах, контекст-меню) | **скрыты** (см. «Матрица подавления») | показаны |
| Property-форма (`CanvasSideBar`) при выборе ноды | **не открывается** (в `split` выбор ноды = навигация к строке YAML, см. click-to-source) | редактируемая (как сейчас) |
| Синхронизация YAML → канвас | **авто-ресид** (debounce + parse-guard) | ручной «Apply to canvas» (как сейчас) |
| Apply/Take conflict-flow | не нужен (канвас не мутирует) | как сейчас |
| Бейдж | «read-only preview» над/в углу канваса | нет |

### Клик по ноде в OFF (по режимам)

| Режим | Поведение клика по ноде |
|---|---|
| `split` | базовый MVP (Task 6): property-форма **не открывается**, выбор лишь подсвечивает ноду. С расширением click-to-source — дополнительно скролл Monaco к строке YAML + подсветка строки |
| `visual` (только канвас, Monaco не виден) | инспекция через переключение в `split` (read-only-форму не вводим до iframe-миграции) |
| `yaml` | канвас не показан — неприменимо |

> Подавление property-формы — часть базового MVP (Task 6). Скролл-к-строке — расширение click-to-source (задачи `CTS-*` ниже); оно надстраивается над уже выключенной формой.

### Матрица подавления edit-контролов (read-only)

Все механизмы активны только при `visualEditingEnabled === false` (gate через read-only-класс на контейнере / пропы), ON-поведение не трогаем. Приоритет — без патча Kaoto; патч `.yarn/patches/@kaoto-kaoto-*` — fallback, если CSS/селекторы окажутся нестабильны.

| Контрол | Где (Kaoto 2.9.0) | Механизм подавления | Патч? |
|---|---|---|---|
| Верхний `ContextToolbar` (New/Undo/Redo/Flows/Copy/Export/Generate docs) | `Visualization.js` хардкодит `<Canvas contextToolbar={<ContextToolbar/>}>` | инлайн-копия `Visualization` (как уже инлайнен `RouteVisualization`) → `contextToolbar={null}` в OFF | нет |
| «Open Catalog» в control-bar | `Canvas.js`: кнопка пушится `if (catalogModalContext)` | `catalogModalContext = undefined` из `CiteckCatalogModalProvider` в OFF | нет |
| DnD-перестановка нод | `CustomNode.js`: `settingsAdapter…experimentalFeatures.enableDragAndDrop` (default `true`) | Kaoto `SettingsProvider` с `enableDragAndDrop:false` в OFF | нет |
| hover-`StepToolbar` (delete/replace/disable…) + «+Add step» на ноде | `CustomNode.js`: `shouldShowToolbar` (только `onHover`/`onSelection`, off нет) | CSS-hide `.custom-node__toolbar`, `[data-testid="quick-append-step"]` под read-only-классом | нет (CSS) |
| «+Add step» на ребре | `CustomEdge.js` (`AddStepIcon`) | CSS-hide | нет (CSS) |
| Контекст-меню (Add/Copy/Delete/Disable/Duplicate/Insert/Move) | `withContextMenu(onContextMenu)` на ноде — CSS бессилен | `contextmenu`-listener в capture-фазе на контейнере канваса → `preventDefault`/`stopPropagation` в OFF (swallow до React-хендлера) | нет (swallow) |
| Property-форма (`CanvasSideBar`) | `Canvas.js:157`: `sideBar: isSidebarOpen ? <CanvasSideBar/> : null` | CSS-hide/collapse панели side-bar под read-only-классом (выделение остаётся для click-to-source) | нет (CSS) |

## Изменения в `KaotoModeler`

Новый проп `visualEditingEnabled` (default `true` — текущие вызовы и тесты не ломаются):

```js
KaotoModeler.propTypes = {
  // ...
  visualEditingEnabled: PropTypes.bool   // default true
};
```

Когда `visualEditingEnabled === false`:

1. **Read-only канвас.** `handleCanvasCodeChange` сбрасывает изменения канваса (не вызывает `setYamlState` / `propagate`). Канвас-мутации остаются эфемерными во внутреннем состоянии Kaoto и затираются при следующем авто-ресиде. Гарантия read-only — на уровне персистентности (ничего из канваса не попадает в `onChange`/Save).
   - Дополнительно: бейдж «read-only preview» в углу канваса + скрытие edit-контролов (см. «Матрица подавления», Task 5/6) — интеракционный guard поверх персистентного.
   - **Трейдоф:** грубый overlay (`pointer-events: none`) в MVP **не делаем** — он заблокировал бы pan/zoom/инспекцию и сам click-to-source; вместо него точечно прячем/глушим конкретные edit-контролы (Task 5/6). Нативного `readOnly`-пропа у `RouteVisualization` нет (контракт — только `catalogUrl/code/codeChange`), поэтому 100%-честный read-only канваса (включая селекшен-стейт) — повод к iframe-миграции (post-MVP, п.10 родительского плана).

2. **Авто-ресид канваса из YAML (debounce + parse-guard).** `useEffect` на `yamlState`:
   - debounce ~400 мс после остановки ввода;
   - parse-guard: `yaml.load(yamlState)` в try/catch (js-yaml уже в зависимостях, см. `yamlSteps.js`). Ресид (`setCanvasSeed(yamlState)` + `setCanvasMountKey(k => k+1)`) **только если YAML распарсился**; на промежуточно-невалидном YAML канвас держит прошлую валидную схему (без parse-crash `RouteVisualization`);
   - очистка таймера при unmount / новом вводе.

3. **Упрощение dirty/conflict-логики.** При OFF канвас не эмитит расходящихся мутаций → `pendingCanvasYaml` всегда `null`, тулбар Apply/Take/«hidden draft» не показывается, `onDirtyChange` всегда `false`. Save блокируется только обычными причинами (`isLoading`/`isSaving`/нет триггера).

Когда `visualEditingEnabled === true` — поведение строго как сейчас (никаких регрессий).

## Изменения в `CamelDslEditor`

1. Прочитать флаг на mount: `ConfigService.getValue(CAMEL_VISUAL_EDITING_ENABLED)` → state `visualEditingEnabled` (initial `false`, обновляется по резолву промиса).
2. Дефолтный `viewMode`: `visualEditingEnabled ? 'visual' : 'split'`. Инициализировать после резолва флага (или дефолт `split`, переключить на `visual` при ON — `split` как безопасный стартовый, чтобы не мигало).
3. Прокинуть `visualEditingEnabled` в `KaotoModeler`.
4. Кнопки `VIEW_MODES` оставить все три (visual при OFF — read-only превью).

## Список unit-тестов (писать вместе с кодом)

> Дизайн-инвентарь (Tasks 1–4). Канонический per-task список тестов — в чекбоксах «Implementation Steps», включая подавление (Task 5/6) и click-to-source (`CTS-*`).

`ConfigService`:
- `getValue(CAMEL_VISUAL_EDITING_ENABLED)` возвращает `false` при пустом/отсутствующем серверном значении (default).
- `?bool`-атрибут формируется для ключа (тип BOOLEAN).

`KaotoModeler` (расширить `KaotoModelerCanvasMonacoSync.test.js` или новый файл):
- OFF: `handleCanvasCodeChange` не вызывает `onChange` (канвас read-only).
- OFF: правка Monaco после debounce ремоунтит канвас с новым `code` (валидный YAML) — проверка bump `key`/`canvasSeed`.
- OFF: невалидный YAML НЕ ремоунтит канвас (parse-guard держит прошлый seed).
- OFF: `onDirtyChange` никогда не зовётся с `true`; тулбар Apply/Take не рендерится.
- OFF: рендерится бейдж «read-only preview».
- ON (default `visualEditingEnabled`): поведение без изменений — существующие тесты Apply/Take/divergence зелёные.

`CamelDslEditor`:
- Флаг OFF → дефолтный `viewMode === 'split'`, в `KaotoModeler` ушёл `visualEditingEnabled={false}`.
- Флаг ON → дефолтный `viewMode === 'visual'`, `visualEditingEnabled={true}`.

## Development Approach (ralphex)

- **Testing approach:** Regular (код → тесты в той же задаче). Каждая задача завершается написанием/обновлением unit-тестов и зелёным прогоном, прежде чем переходить к следующей.
- Каждая задача — один логический блок; малые сфокусированные изменения; обратная совместимость (`visualEditingEnabled` default `true` — текущие вызовы не ломаются).
- Тест-команда: `yarn test <path>` (jest). Полный `yarn build` — только в конце milestone (см. [[feedback_no_full_build_per_change]]), не после каждой правки.
- Не переходить к следующей задаче с падающими тестами.

### Progress Tracking

- `[x]` сразу по завершении пункта; ➕ — новые задачи; ⚠️ — блокеры.
- Обновлять план при изменении объёма.

## Implementation Steps

### Task 1: Флаг `CAMEL_VISUAL_EDITING_ENABLED` в ConfigService

- [x] добавить `export const CAMEL_VISUAL_EDITING_ENABLED = 'app/integrations$camel-visual-editing-enabled';` в `src/services/config/ConfigService.js` (рядом с `ALFRESCO_ENABLED` — тот же `app/<app>$`-формат; токен app — `integrations`, см. исправление 2026-06-08)
- [x] добавить запись в `CONFIG_PROPS`: `{ defaultValue: false, type: TYPE_BOOLEAN }`
- [x] тест: `getValue(CAMEL_VISUAL_EDITING_ENABLED)` возвращает `false` при пустом/отсутствующем серверном значении (default)
- [x] тест: для ключа формируется `?bool`-атрибут (тип BOOLEAN, через `_getConfigAttribute`)
- [x] прогнать тесты ConfigService — зелёные перед Task 2

### Task 2: Read-only канвас в `KaotoModeler` (проп `visualEditingEnabled`)

- [x] добавить проп `visualEditingEnabled: PropTypes.bool` в `KaotoModeler.propTypes`, default `true` (`?? true` при чтении)
- [x] при `false`: `handleCanvasCodeChange` не вызывает `setYamlState`/`propagate` — канвас-мутации эфемерны, не попадают в `onChange`/Save
- [x] при `false`: байпас dirty/conflict — `pendingCanvasYaml` всегда `null`, тулбар Apply/Take/«hidden draft» не рендерится, `onDirtyChange` не зовётся с `true`
- [x] при `false`: бейдж «read-only preview» в углу канваса
- [x] зафиксировать в JSDoc/комментарии соотношение с существующим пропом `readOnly` (весь редактор) vs `visualEditingEnabled` (только канвас)
- [x] тест: OFF — `handleCanvasCodeChange` не вызывает `onChange`
- [x] тест: OFF — `onDirtyChange` не вызывается с `true`, тулбар Apply/Take не в DOM
- [x] тест: OFF — рендерится бейдж «read-only preview»
- [x] тест: ON (default) — существующие Apply/Take/divergence кейсы остаются зелёными
- [x] прогнать `KaotoModelerCanvasMonacoSync.test.js` — зелёные перед Task 3

### Task 3: Авто-ресид канваса из YAML (debounce + parse-guard)

- [x] `useEffect` на `yamlState` (активен при `visualEditingEnabled === false`): debounce ~400 мс
- [x] parse-guard: `yaml.load(yamlState)` в try/catch (js-yaml, как в `yamlSteps.js`); ресид (`setCanvasSeed(yamlState)` + `setCanvasMountKey(k => k+1)`) только при успешном парсинге
- [x] на невалидном YAML канвас держит прошлый валидный seed (без parse-crash `RouteVisualization`)
- [x] очистка таймера при unmount / новом вводе
- [x] тест: OFF — правка Monaco после debounce ремоунтит канвас с новым `code` (bump `canvasMountKey`/`canvasSeed`); использовать fake timers
- [x] тест: OFF — невалидный YAML НЕ ремоунтит канвас (parse-guard держит прошлый seed)
- [x] прогнать тесты — зелёные перед Task 4

### Task 4: Чтение флага и дефолтный `viewMode` в `CamelDslEditor`

- [x] на mount: `ConfigService.getValue(CAMEL_VISUAL_EDITING_ENABLED)` → state `visualEditingEnabled` (initial `false`, обновляется по резолву промиса)
- [x] стартовый `viewMode` — `split`; при резолве флага ON переключить на `visual` (старт `split`, чтобы не мигало)
- [x] прокинуть `visualEditingEnabled` в `KaotoModeler`; оставить все три кнопки `VIEW_MODES`
- [x] проверить, что флип `viewMode`/резолв флага НЕ перетряхивает `kaotoKey` (лишний ремоунт)
- [x] тест: флаг OFF → дефолтный `viewMode === 'split'`, в `KaotoModeler` ушёл `visualEditingEnabled={false}`
- [x] тест: флаг ON → дефолтный `viewMode === 'visual'`, `visualEditingEnabled={true}`
- [x] прогнать тесты — зелёные перед Task 5

### Task 5: Скрыть edit-контролы канваса в OFF — Tier 0 (без патча)

- [x] инлайн-копия `Visualization` (в `RouteVisualizationWithCatalog` или рядом): рендерить `<Canvas contextToolbar={visualEditingEnabled ? <ContextToolbar/> : null}>` (внутренние импорты `@kaoto-internal/.../Canvas`, `ContextToolbar`)
- [x] прокинуть `visualEditingEnabled`/`readOnly` через `RouteVisualizationWithCatalog` → `Viz`
- [x] «Open Catalog» (control-bar) + действие открытия каталога у «+Add step»: в OFF отдавать `catalogModalContext = undefined` из `CiteckCatalogModalProvider` (саму иконку «+Add step» прячет Task 6)
- [x] DnD off: обернуть дерево в Kaoto `SettingsProvider` с `experimentalFeatures.enableDragAndDrop = false` при OFF
- [x] тест: OFF — верхний `ContextToolbar` не в DOM; ON — присутствует
- [x] тест: OFF — кнопка «Open Catalog» не рендерится (`catalogModalContext` undefined)
- [x] прогнать тесты — зелёные перед Task 6

### Task 6: Подавить per-node edit-аффордансы и property-форму в OFF — Tier 1 (CSS + swallow)

- [x] read-only-класс на контейнере канваса при OFF (напр. `kaoto-modeler--readonly`)
- [x] CSS под этим классом: скрыть `.custom-node__toolbar`, `[data-testid="quick-append-step"]` (нода + ребро), панель `CanvasSideBar` (collapse side-bar)
- [x] swallow контекст-меню: `contextmenu`-listener в capture-фазе на контейнере канваса → `preventDefault`/`stopPropagation` при OFF
- [x] gate: всё активно только при `visualEditingEnabled === false`; ON — без изменений
- [x] тест: OFF — `contextmenu` на канвасе не доходит до Kaoto-хендлера (swallow); ON — доходит
- [x] тест: OFF — read-only-класс присутствует; ON — отсутствует
- [x] ⚠️ fallback (если CSS-селекторы нестабильны): патч `.yarn/patches/@kaoto-kaoto-*` с гардом рендера в `CustomNode/Edge/Group` — не потребовался (CSS+swallow стабильны, селекторы покрыты тестами); держим как запасной вариант на bump Kaoto
- [x] прогнать тесты — зелёные перед Task 7

### Task 7: Verify acceptance criteria

- [x] проверить, что все пункты «Матрицы поведения» и «Матрицы подавления» реализованы для OFF и ON (cross-check кода: handleCanvasCodeChange early-return, gate dirty/conflict, авто-ресид, бейдж, kaoto-modeler--readonly + SCSS, swallow contextmenu, InlineVisualization contextToolbar=null, catalogModalContext=undefined, SettingsProvider enableDragAndDrop=false — всё под `visualEditingEnabled === false`; ON-ветки не тронуты)
- [x] OFF: верхний тулбар / Open Catalog / DnD / контекст-меню / «+Add step» / hover-StepToolbar / property-форма — недоступны; pan/zoom/layout — работают (покрыто unit-тестами Task 5/6; ручная pan/zoom-проверка — в Post-Completion чек-листе на стенде)
- [x] прогнать полный unit-suite затронутых модулей (ConfigService, KaotoModeler, RouteVisualizationWithCatalog, CamelDslEditor) — 204/204 зелёные (14 suites)
- [x] запустить линтер по изменённым файлам — все замечания исправить (eslint --fix: 0 errors; авто-фиксируемые prettier/import-order исправлены; остались 2 безобидных warning'а «пустая строка перед комментарием-блоком» — оставлены намеренно для читаемости)
- [x] `yarn build` (финальный milestone-прогон) — без ошибок (✓ built in 5m 4s, exit 0)

### Task 8: [Final] Документация

- [x] обновить статус в `docs/plans/kaoto/README.md` (строка `kaoto-visual-editing-flag.md`) при завершении кода

## Post-Completion

*Ручная проверка на стенде / внешние решения — без чекбоксов, информационно.*

**Приёмочный чек-лист (стенд, Playwright/records):** ✅ **пройден 2026-06-18** на local-стенде `tdcuosa` (ecos-ui из ветки `feature/COREDEV-208-kaoto-integration`, задеплоен в прокси; маршрут `integrations/camel-dsl@gitlab-commits-sync`). Пункты 1–3, 5, 6 — read-only MVP; пункт 4 (флаг ON) относится к COREDEV-312.

1. ✅ **Default (флаг не задан):** редактор открылся в `split`; канвас показал схему (`gitlab-commits-sync` → `ecos-records-mutate`); Monaco с YAML маршрута. (Save в OFF не проверялся — запись править нельзя; YAML-правки живут в локальном состоянии.)
2. ✅ **Невалидный YAML:** при битом YAML канвас не упал, держал прошлую схему (7 нод, нет crash-оверлея); после валидного YAML перерисовался в новый маршрут (`timer` → `log`).
3. ✅ **Подавление edit-контролов при OFF:** нет верхнего тулбара (New/Undo/Redo/Copy/Export), «Open Catalog», «+Add step», hover-StepToolbar (`.custom-node__toolbar` = `display:none` даже на hover); правый клик не открывает контекст-меню; клик по ноде не открывает property-форму. Pan/zoom/layout-контролы на месте. **Click-to-source:** клик по ноде `…steps.0.to` → подсветка `kaoto-modeler__active-line` на строке `- to:` (строка 11).
4. **Флаг ON** (`camel-visual-editing-enabled = true` через config UI/records): редактор открывается в `visual`; верхний тулбар/каталог/контекст-меню/«+ Add step» доступны; drag / property-формы пишут в YAML; Apply/Take-flow работает как раньше. — **не проверялось (COREDEV-312).**
5. ✅ **Переключение вкладок при OFF:** в `visual` Monaco скрыт, канвас на весь экран, бейдж «read-only preview», контролы подавлены; `split`/`yaml` переключаются.
6. ✅ **JS-консоль / network** (Playwright): нет Kaoto-релевантных ошибок. Каталог `camel-catalog/*` грузится 200; `net::ERR_ABORTED` — отменённые дубли React StrictMode (повторные запросы 200). Сторонний шум (`ai/...availability` 404, `theme/favicon` 401) к редактору не относится.

**Внешнее решение (закрыто):**

- Владелец ключа — webapp `integrations` (проект `ecos-integrations`); ключ `app/integrations$camel-visual-editing-enabled`. Значение заведено артефактом `src/main/resources/eapps/artifacts/app/config/camel-visual-editing-enabled.yml` (default `false`); для канареечной раскатки выставлять `true` на нужном стенде.

### E2E runbook (ручной Playwright)

В `ecos-ui` нет e2e-харнесса в репозитории (нет Playwright/Cypress в deps/конфигах/скриптах). Поднимать его с нуля под read-only MVP несоразмерно — нужен живой стенд, в CI не гоняется. Поэтому e2e read-only зафиксирован как **воспроизводимый ручной сценарий** (через Playwright MCP). Прогон логики click-to-source автоматизирован юнит-тестами (`clickToSourcePipeline.test.js`).

**Предусловия:** ecos-ui собран из ветки и задеплоен (`yarn build:stage` → `docker cp build/. citeck_proxy_<ns>_default:/var/www/assets/`); integrations поднят; есть запись `integrations/camel-dsl@<id>`.

1. `browser_navigate` → `http://localhost/v2/camel-dsl-editor?recordRef=integrations/camel-dsl@<id>`; дождаться загрузки (lazy-бандл Kaoto ~3–5 MB).
2. Дефолт — `split`; канвас рисует ноды, Monaco показывает YAML.
3. `browser_evaluate`: супрессия OFF — `.custom-node__toolbar` (`display:none`), нет `Open Catalog`/`New|Undo|Redo|Copy|Export`/add-step/контекст-меню; бейдж `read-only preview` присутствует.
4. `browser_click` по ноде (`g[data-kind="node"][data-id="<entityId>|<modelPath>"] >> nth=1`); `browser_evaluate` Monaco: есть декорация `kaoto-modeler__active-line` на ожидаемой строке, property-форма не открыта.
5. Невалидный YAML через Monaco `setValue` → канвас не падает (ноды на месте, нет crash-оверлея); валидный YAML → перерисовка.
6. `browser_console_messages`/`browser_network_requests`: нет Kaoto-релевантных ошибок и 4xx/5xx.

Эталонный прогон 2026-06-18 (стенд `tdcuosa`, маршрут `gitlab-commits-sync`) — выше в чек-листе. **Независимый e2e-проход click-to-source 2026-06-18** на маршруте `gitlab-merge-requests-sync` через Playwright MCP: клик по ноде `…steps.0.to` → подсветка `kaoto-modeler__active-line` на строке 10 (`- to: "ecos-records-mutate…"`); клик по `…route.from` → подсветка перешла на строку 3 (`from:`), прошлая снята; property-форма не открылась. Скриншот: `camel-e2e-click-to-source.png`.

## Риски / ограничения

| Риск | Митигация |
|---|---|
| Эфемерные правки канваса при OFF вводят в заблуждение (видно, но не сохранится) | Edit-контролы скрыты (Task 5/6: тулбар/Catalog/DnD/контекст-меню/«+Add step»/StepToolbar/форма) — поверхностей для случайной правки почти не остаётся; бейдж «read-only preview»; полностью честный read-only — через iframe-миграцию (post-MVP п.10). |
| Подавление через CSS/swallow ломается на bump'е Kaoto (селекторы `.custom-node__toolbar`/`data-testid` изменились) | Селекторы покрыты тестами (Task 6); fallback — патч `.yarn/patches/@kaoto-kaoto-*`; verify на стенде после bump. |
| Авто-ресид мигает/дёргает выделение на каждый ремоунт | debounce 400 мс; ремоунт только при изменившемся валидном YAML; OFF-режим — превью, активного выделения для правки нет. |
| parse-crash `RouteVisualization` на невалидном YAML | parse-guard (js-yaml) до ресида. |
| Pan/zoom при OFF (если позже добавим overlay) | overlay в MVP не вводим; pan/zoom доступны; truly-readonly — отдельно. |
| Флаг не подхватился (кеш localStorage) | `ConfigService` форс-обновляет кеш по таймауту; на стенде проверять после refresh. |

---

## Расширение: Click-to-source навигация (опционально)

> **Отдельный трек, не нужен для MVP флага.** Естественный сценарий именно для OFF (read-only-`split`-превью): кликнул ноду на канвасе → Monaco скроллится к соответствующей строке YAML и подсвечивает её. Делается после базового флага (Task 1–8 выше). Перенесено из `kaoto-integration-plan.md` (п.11). Задачи помечены `CTS-*`, чтобы не путать с нумерацией флага.

### Цель

В OFF-режиме (канвас — read-only-превью) дать навигацию «откуда это в YAML»: клик по ноде → `revealLineInCenter` + line-decoration в Monaco. Только при `visualEditingEnabled === false`. **Подавление property-формы — уже в базовом MVP (Task 6)**, поэтому click-to-source лишь надстраивает скролл над выключенной формой (в ON активное редактирование само ведёт по формам).

### Спайк (выполнен и подтверждён на стенде 2026-06-05)

- **Id ноды топологии = `` `${entityId}|${modelPath}` ``** (он же id, который отдаёт `SELECTION_EVENT` PatternFly). Подтверждено на стенде tdcuosa: `route-spiketest|route.from.steps.0.to`, `…|route.from.steps.1.choice.when.0.steps.0.log`, `…|route.from.steps.1.choice.otherwise.steps.0.log`, `…|route.from.steps.2.log`. Клик по ноде открыл форму именно этой ноды — selection-цепочка `SELECTION_EVENT → getNodeById → форма` работает end-to-end (в OFF форму глушим в Task 6, но `SELECTION_EVENT` всё равно стреляет — этого достаточно для навигации).
- **`modelPath` (после `|`) 1:1 совпадает с нашим `dslPath`** из `yamlSteps.js` (`pathId`). Маппинг: `id.split('|')[1]` → `modelPath`; `arrayIndex` берём из порядка entity в `EntitiesContext.visualEntities`; `pathId = ` `` `${arrayIndex}.${modelPath}` ``.
- **`entityId` недетерминирован** (random `route-XXXX`, если в YAML нет `route.id`) — **не блокер**, префикс до `|` отбрасываем; матч in-session.
- **Рёбра** — отдельный `kind=edge`, формат `id1 >>> id2` → отфильтровать.
- **`yaml` (eemeli) уже в зависимостях** → `parseDocument` + `LineCounter` дают `path → line`.
- **Точка интеграции:** `controller` создаётся в `Viz` (`RouteVisualizationWithCatalog.jsx:46`); `controller.addEventListener(SELECTION_EVENT, cb)` внутри `Viz` + проброс `cb` наверх.
- **Не снято эмпирически:** shorthand-форма `- from:` (без `route`-обёртки) — проверена только `- route:`-форма. Покрыть кейсом в Task CTS-1/CTS-2.

### Development Approach (CTS)

- **Testing approach:** Regular (код → тесты в той же задаче). Тест-команда `yarn test <path>`; полный `yarn build` — в конце.
- Все CTS-правки активны только при `visualEditingEnabled === false` — не трогают ON-поведение (нет регрессий Apply/Take).
- Internal-coupling с `@patternfly/react-topology`/`@kaoto-internal` (как в палитре) — изолировать в одном утиль-модуле, чтобы bump Kaoto чинился точечно.

### Implementation Steps (CTS)

#### Task CTS-1: Карта `pathId → line` из YAML (`yaml` eemeli)

- [x] добавить util `buildPathLineMap(yamlSource)` (новый модуль, напр. `KaotoModeler/yamlLineMap.js`): `parseDocument` + `LineCounter`, обход узлов, ключи в формате нашего `pathId` (`0.route.from.steps.0.to` и shorthand `0.from.steps.0.to`)
- [x] parse-guard: невалидный YAML → пустая карта (без throw)
- [x] тесты: `from`/`to`/вложенные `choice.when.0.steps.0.log`/`otherwise` → корректные номера строк (формы `- route:` и `- from:`)
- [x] тесты: невалидный YAML → пустая карта; пустой/не-массив YAML → пустая карта
- [x] прогнать тесты — зелёные перед CTS-2 (15/15 зелёные; jest config: `^yaml$` → CJS dist, т.к. jsdom тянул ESM browser-entry)

#### Task CTS-2: Нормализация id ноды Kaoto → `pathId`

- [x] добавить util `kaotoNodeIdToPathId(nodeId, visualEntities)`: `split('|')` → `modelPath`; `arrayIndex` по порядку `entity.id` в `visualEntities`; вернуть `` `${arrayIndex}.${modelPath}` `` (или `null`) — модуль `KaotoModeler/kaotoNodeId.js`
- [x] отбросить рёбра (`nodeId.includes(' >>> ')`) и неизвестные entity → `null`
- [x] нормализовать root `route.from` ↔ shorthand `from` под формат `buildPathLineMap` (`modelPath` 1:1 с `dslPath` → обе формы проходят как есть; защитный trim точек)
- [x] тесты: `route-x|route.from.steps.0.to` → `0.route.from.steps.0.to`; вложенные; edge → `null`; неизвестный entityId → `null`; multi-route → правильный индекс
- [x] прогнать тесты — зелёные перед CTS-3 (14/14 зелёные)

#### Task CTS-3: Проброс события выбора из `RouteVisualizationWithCatalog`

- [x] добавить проп `onNodeSelect: PropTypes.func`; внутри `Viz` (уже инлайнен в Task 5) — `controller.addEventListener(SELECTION_EVENT, ids => onNodeSelect?.(ids))` (импорт `SELECTION_EVENT` из `@patternfly/react-topology`)
- [x] cleanup listener при unmount; не подписываться, если `onNodeSelect` не передан
- [x] тесты: при эмите `SELECTION_EVENT` (mock controller) вызывается `onNodeSelect` с массивом id; отписка при unmount
- [x] прогнать тесты — зелёные перед CTS-4 (12/12 зелёные)

#### Task CTS-4: Доступ к Monaco + scroll/highlight в `KaotoModeler`

- [x] `onMount`-ref на `<Editor>`; helper `revealLine(line)` = `revealLineInCenter` + `deltaDecorations` (подсветка строки), сброс прошлой декорации — изолирован в `KaotoModeler/monacoLineReveal.js` (`createLineRevealer`), привязка инстанса через `handleEditorMount`
- [x] активация только при `visualEditingEnabled === false` (`revealLine` early-return в ON)
- [x] тесты: для заданной строки вызывается `revealLineInCenter` и ставится decoration; повторный вызов сбрасывает прошлую (`monacoLineReveal.test.js`) + wiring `onMount` (`KaotoModelerCanvasMonacoSync.test.js`)
- [x] прогнать тесты — зелёные перед CTS-5 (30/30 зелёные: 26 sync + 4 reveal)

#### Task CTS-5: Связка selection → scroll (`KaotoModeler`)

- [x] передать `onNodeSelect` в `RouteVisualizationWithCatalog` (только при OFF) — `onNodeSelect={visualEditingEnabled ? undefined : handleNodeSelect}`
- [x] на выбор ноды: `kaotoNodeIdToPathId` → lookup в `buildPathLineMap(yamlState)` (карта мемоизирована по `yamlState`) → `revealLine`; `visualEntities` форвардятся из `Viz` (EntitiesContext) вторым аргументом `onNodeSelect(ids, visualEntities)`
- [x] debounce/guard: пустой/не-массив ids, edge-id и `null` (`kaotoNodeIdToPathId` → null) → no-op; нет строки в карте → no-op
- [x] тесты: выбор ноды `…steps.2.log` → реврал строки 9; edge-id игнор; неизвестный entityId → no-op; pathId без строки → no-op; пустой select → no-op; ON-режим → `onNodeSelect` не передан (подписки нет)
- [x] прогнать тесты — зелёные перед CTS-6 (242/242 зелёные, 15 suites)

#### Task CTS-6: Verify + доки + интеграция-план

- [x] прогнать unit-suite затронутых модулей (yamlLineMap, normalize, RouteVisualizationWithCatalog, KaotoModeler) — 77/77 зелёные (5 suites: yamlLineMap, kaotoNodeId, RouteVisualizationWithCatalog, KaotoModelerCanvasMonacoSync, monacoLineReveal)
- [x] линтер по изменённым файлам — 0 errors (eslint через `DISABLE_V8_COMPILE_CACHE=1`; на jsx остались 2 намеренных import/order warning'а — авто-фикс оторвал бы поясняющие комментарии от их импортов, как и в Task 7)
- [x] `yarn build` — без ошибок (✓ built in 3m 49s, exit 0)
- [x] в `kaoto-integration-plan.md` отметить п.11 как реализованный (ссылка сюда) — п.11 помечен ✅, добавлено описание утилей и selection-связки

### Post-Completion (CTS) — стенд

*Без чекбоксов, ручная проверка.*

1. OFF read-only-split: открыть маршрут → клик по ноде на канвасе → Monaco скроллится к её строке и подсвечивает; клик по другой ноде — перенос подсветки.
2. Вложенные ноды (`when`/`otherwise`/nested step) → правильная строка.
3. ON-режим: навигация не вмешивается в Apply/Take, формы работают как раньше.
4. Playwright: нет JS-ошибок/4xx-5xx; рёбра по клику не дают ложного скролла.
