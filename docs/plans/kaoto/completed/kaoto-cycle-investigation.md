# Kaoto Maximum-update-depth cycle — расследование

> Отделено от основного [kaoto-integration-plan.md](../kaoto-integration-plan.md), чтобы не раздувать его при каждом обращении. План содержит короткое резюме и ссылку сюда.

## Контекст

При встраивании `<RouteVisualization>` из `@kaoto/kaoto@2.9.0` в `ecos-ui` наблюдается бесконечный цикл re-render внутри Kaoto Canvas. На official Kaoto demo и в изолированном sandbox того же Kaoto — цикла нет (см. план §4.1.1).

**Проявления для пользователя:**
- При hover на ноду курсор меняется на pointer (hover-events работают).
- Клик на ноду НЕ открывает property panel (selection сбрасывается за ~100мс).
- `+ Add step` button реагирует на hover, но клик не открывает palette.
- Drag-drop не работает.
- В dev console спамится `Warning: Maximum update depth exceeded` (~3/sec).
- В prod warning отключён, но cycle продолжается на той же скорости.

**Цель:** найти root cause и устранить, либо обоснованно перейти на iframe-embed (опция C) или гибридный MVP (опция E).

> **СТАТУС 2026-04-27 ночь: ЦИКЛ ПОЛНОСТЬЮ УСТРАНЁН.** См. §0-NEW. Первопричина — антипаттерн в Kaoto-обёртке `RouteVisualization.tsx` (`useEffect` зависит от собственного output state через reducer, всегда возвращающий новый ref). Patch A (identity-preserving reducer) даёт **mut/sec 0.20** vs 1141 baseline (×5700 reduction), **cycle/sec = 0**. Опции C (iframe) и E (гибрид) больше не нужны как обходные пути.

## Замеры (хронология, актуальные на 2026-04-27)

| Сценарий | `Maximum update depth` warnings/30с | DOM mutations/30с (canvas) | Канал |
|---|---|---|---|
| Official Kaoto demo (kaotoio.github.io/kaoto/) | 0 | n/a | вне нашего env |
| `kaoto-sandbox/` (React 18.2 isolated) | 10–20 (только mount) | n/a | вне ecos-ui shell |
| ecos-ui + KaotoModeler + Monaco split + React 18.2 dev | 110 (3.7/с) | n/a | full shell |
| ecos-ui + bare embed `<RouteVisualization>` + React 18.2 dev | 83 (2.8/с) | n/a | full shell, без Modeler |
| ecos-ui + bare embed + empty YAML + React 18.2 dev | 177 (5.9/с) | n/a | empty triggers лавину |
| ecos-ui + bare embed + React 18.3.1 dev | 45 (1.5/с) | n/a | -50% от 18.2 |
| ecos-ui + 18.3.1 + IconResolver/Popper patches | 40 (1.3/с) | n/a | патчи дали лишь -10% |
| **Bypass /v2/kaoto-test?layer=bare, React 18.2 dev** | 103 (3.4/с) | 34,240 (1141/с) | без StrictMode/Provider/Router/App |
| **Bypass /v2/kaoto-test?layer=strict, React 18.2 dev** | 47 (1.6/с) | n/a | StrictMode сглаживает |
| **Bypass + prod-build (vite preview), React 18.2 prod** | **0** ⚠️ ложный negative | **53,152 (1772/с)** | warning отключён в prod React, но MobX churn идёт |

## Ключевые находки

### 0-NEW. ИСТИННЫЙ ROOT CAUSE (найден 2026-04-27 ночь, опция R; ЦИКЛ УСТРАНЁН)

**`@kaoto/kaoto@2.9.0` — антипаттерн «`useEffect` зависит от собственного output» в `RouteVisualization`.**

`packages/ui/src/external/RouteVisualization/RouteVisualization.tsx:18-28`:

```tsx
const VisibleFlowsVisualization: FunctionComponent = ({ className }) => {
  const { visibleFlows, visualFlowsApi } = useContext(VisibleFlowsContext)!;
  const entitiesContext = useContext(EntitiesContext);
  const visualEntities = entitiesContext?.visualEntities ?? [];

  useEffect(() => {
    visualFlowsApi.showFlows();          // ← вызывает dispatch
  }, [visibleFlows, visualFlowsApi]);    // ← но зависит от visibleFlows!

  return <Visualization entities={visualEntities} />;
};
```

Reducer `'showFlows'` (`flows-visibility.ts:55-63`):

```js
case 'showFlows':
  return Object.keys(state).reduce((acc, flowId) => {
    ...
    acc[flowId] = true;     // даже если уже true
    return acc;
  }, {});                   // ← НОВЫЙ объект каждый раз
```

**Цепочка цикла:**
1. `useEffect` → `showFlows()` → `dispatch('showFlows')`
2. Reducer возвращает **новый объект** через `reduce(..., {})` — даже если все значения те же
3. `visibleFlows` ref изменился → useEffect deps изменился → бежит снова
4. React batching + `requestAnimationFrame` лимитирует ~120Hz (отсюда 82.7/сек, привязанный к refresh rate монитора)
5. Каждая итерация → Canvas видит новый `visibleFlows` → его useEffect (`Canvas.tsx:75`) бежит → `controller.fromModel + layout()` → mobx churn

**Объясняет все наблюдения:**
- 82.7Hz ≈ 120Hz refresh rate — RAF scheduling
- `fromModel`/`runLayout` оба 82.7/сек — оба внутри Canvas useEffect
- §0 BaseNode был **промежуточным амплификатором** mobx churn, не первопричиной
- Clean reinstall не помог — баг в Kaoto код, не в зависимостях
- Production build не лечит — баг логический, не dev-only
- **Sandbox показывает только 10–20 warnings на mount** — там тот же баг, но без mobx-react observer cascade вокруг (как в полном shell), цикл затухает после initial RAF ticks
- **Official Kaoto demo чист** — он использует `<App>` напрямую (через router → pages → `<Visualization>`), **не `RouteVisualization`**. Эта обёртка — отдельное external API для embedding, и баг **только в ней**

**Upstream-статус:** баг существует в `RouteVisualization.tsx` с **первого commit'а файла** (`0f37c407`, 6 sept 2024, mmelko/Red Hat). В upstream `main` до 2026-04-27 не исправлен. Maintainer (lordrip) применил **тот же identity-preserving паттерн** для `'initVisibleFlows'` в commit `15ab0413` (Oct 2024) с описанием «Avoid recreating the VisibleFlows object — causing some 'useEffects' to triggered twice», но **не применил к `'showFlows'`/`'hideFlows'`**. Видимо, в их `<App>`-сценарии `showFlows` вызывается только из onClick (user actions), не из `useEffect` с deps `[visibleFlows]` — поэтому их не било. Никто из maintainer'ов не использует `RouteVisualization` напрямую (vscode-kaoto работает через iframe + postMessage).

**Patch A (применён, identity-preserving reducer для `'showFlows'`/`'hideFlows'`):**

```js
case 'showFlows': {
  const keys = Object.keys(state);
  const targetIds = action.flowIds ? new Set(action.flowIds) : null;
  const allAlreadyCorrect = keys.every((flowId) => {
    const desired = !targetIds || targetIds.has(flowId) ? true : state[flowId];
    return state[flowId] === desired;
  });
  if (allAlreadyCorrect) return state;  // bail out — same reference
  return keys.reduce((acc, flowId) => {
    acc[flowId] = !targetIds || targetIds.has(flowId) ? true : state[flowId];
    return acc;
  }, {});
}
// аналогично для 'hideFlows' с false
```

Хранится как `.yarn/patches/@kaoto-kaoto-npm-2.9.0-656f79ef19.patch`, подключён через `resolutions` в `package.json`. Идеально соответствует upstream-стилю (`15ab0413`) — кандидат в PR в KaotoIO/kaoto.

**Замеры после Patch A** (bypass-bare, 30 сек, /v2/kaoto-test?layer=bare):

| Метрика | До patch (baseline) | После Patch A | После Patch A БЕЗ Patch P |
|---|---:|---:|---:|
| `mut/sec` | 1141 | 0.90 | **0.20** |
| `cycle warnings/sec` | 3.4 | 0 | **0** |
| `mobx events/sec` | 24,236 | 15 | **2** |
| `setGroupDimensionInitializedByChildren/sec` | 3,327 | 0 (top-15) | 0.1 |
| `fromModel`/`runLayout`/`setPosition/sec` | 82.7 / 82.7 / 542 | 0 (top-15) | 0 (top-15) |

**Patch P (BaseNode guard) больше не нужен** после Patch A — без layout-цикла он избыточен, action `setGroupDimensionInitializedByChildren` дёргается лишь 0.1/сек (несколько раз при mount). См. §0 ниже — оставлен для исторического контекста.

### 0. ПРОМЕЖУТОЧНЫЙ амплификатор (был ранее «root cause», после §0-NEW переоценён)

**`@patternfly/react-topology@6.4.0` — антипаттерн «action внутри геттера» в `BaseNode`.**

`node_modules/@patternfly/react-topology/dist/esm/elements/BaseNode.js:189-200`:

```js
setGroupDimensionInitializedByChildren() {  // декорирован `action: true` в mobx
    if (!this.dimensionsInitialized && this.isGroup()) {
        const nodes = this.getChildren().filter(isNode);
        if (nodes.length > 0 && nodes.every((c) => c.isDimensionsInitialized())) {
            this.dimensionsInitialized = true;
        }
    }
}

isDimensionsInitialized() {
    this.setGroupDimensionInitializedByChildren();  // ← вызов mobx-action из обычного геттера
    return this.dimensionsInitialized;
}
```

**Почему это создаёт цикл:**
1. Observer-wrapped Kaoto-компонент (`CustomNode`) во время рендера читает `node.isDimensionsInitialized()`.
2. Геттер вызывает action `setGroupDimensionInitializedByChildren()` — каждый раз создаётся новая mobx action-транзакция, даже если её body — no-op.
3. Action рекурсивно вызывает `c.isDimensionsInitialized()` на всех детях (`every(c => c.isDimensionsInitialized())`), что снова запускает action на каждом ребёнке.
4. Все observable reads внутри action-транзакции записываются как зависимости observer'а. Любое изменение `position`, `dimensions`, `BaseNode` (которое происходит при каждом layout pass) → invalidates observers → observers re-run → снова читают `isDimensionsInitialized()` → snowball.
5. `runLayout` (77 раз/сек) обновляет position/dimensions всех нод, что снова триггерит observers, и так по кругу.

**Замер `mobx.spy()` за 22.5 секунды на `/v2/kaoto-test?layer=bare`:**

| Событие | Частота | Источник |
|---|---:|---|
| `report-end` (computed re-evals) | 10,832/с | mobx core |
| **`action\|setGroupDimensionInitializedByChildren`** | **3,327/с** | BaseNode.js:189 (`PF react-topology`) |
| `reaction\|observer` (mobx-react re-render) | 1,934/с | `mobx-react` обёртка над `CustomNode` |
| `update\|BaseNode` | 619/с | mutations BaseNode props |
| `action\|setPosition` | 542/с | layout positions ноды |
| `update\|position` | 464/с | следствие setPosition |
| `update\|BaseGraph` | 232/с | граф mutations |
| `action\|runLayout` | 77/с | re-layout графа (≈7 нод × 77 layouts/с ≈ 540 setPosition) |
| **Total mobx events** | **24,236/с** | |

Соотношение `3327 actions / 77 layouts ≈ 43` — **на каждый layout pass action `setGroupDimensionInitializedByChildren` дёргается ~43 раза** (рекурсия по дереву). Это полностью объясняет MobX Reaction churn, который ранее был зафиксирован как «root cause» (см. §1) — `mobx-react observerComponent` стек был лишь промежуточным слоем, а первичный source цикла — `BaseNode.isDimensionsInitialized()`.

**Связанные upstream issues:** patternfly/react-topology #8733 (Group dimension calc loop), KaotoIO/kaoto #1623 (visualizing routes infinite re-render).

**Кандидат на patch-package фикс (минимальный, локальный):**

```js
isDimensionsInitialized() {
    if (this.dimensionsInitialized) {
        return true;  // skip action call when already initialized → нет mobx-транзакции
    }
    this.setGroupDimensionInitializedByChildren();
    return this.dimensionsInitialized;
}
```

Functional equivalence: action body уже имеет `if (!this.dimensionsInitialized) {...}`, так что когда флаг true — это no-op. Но даже no-op action создаёт mobx-транзакцию, которая записывает observable reads → **именно она и churn'ится**. Guard в геттере убирает action call целиком в steady state.

Ожидаемый эффект: после первого layout pass все ноды переходят в `dimensionsInitialized = true` → action не вызывается → mutations stop → mut/sec падает с 1224 до единиц.

### 1. Промежуточный слой — MobX Reaction churn (был ранее «root cause», теперь §0)

Stack-trace, захваченный через `console.error` override в bypass:

```
Component stack:
  observerComponent (mobx-react chunk-LDTZTAQR.js:12601)
  CustomNode (Kaoto/ReactFlow chunk-E7JP5ZU2.js:18171)
  observerComponent
  observerComponent
  observerComponent (5+ уровней)

JS stack:
  runReactionsHelper (mobx core chunk-T37VZCR2.js:2736)
  Reaction2.runReaction_
  Reaction2.onInvalidate_
  forceUpdate (mobx-react)
  dispatchSetState (React)
  scheduleUpdateOnFiber
  checkForNestedUpdates
  Warning: Maximum update depth exceeded
```

Это `mobx-react observerComponent` обёртка над Kaoto's `CustomNode` (нода ReactFlow). MobX Reaction постоянно invalidate'ится → `forceUpdate` → setState → bubble → reaction triggers again.

IconResolver/Popper из ранних замеров (план §4.1.2) — частный случай same cycle, не отдельный root cause.

### 2. Shell ecos-ui — НЕ виновник (binary-search §4.1.5 опция A выполнена)

Создан bypass `/v2/kaoto-test?layer=bare`, минующий `runApp` / Provider / ConnectedRouter / StrictMode / App / CacheRoute / PageWrapper / idleTimer / serviceWorker / i18nInit. Cycle сохраняется на том же уровне (3.43/sec в bare vs 3.7/sec в full shell). Гипотеза «App.jsx + Redux + CacheRoute + ModelEditor wrapper'ы держат цикл живым» (ранее закреплённая в плане v3) — опровергнута.

### 3. Production build — НЕ устраняет cycle (опция B' — ложный negative)

Первичный замер `Maximum update depth` counter на prod-build = 0 → ранний вывод «cycle dev-mode-only». Опровергнуто через `MutationObserver`: 1772 mutations/sec в prod-build vs 1141 в dev. Cycle есть в обоих режимах с одинаковой интенсивностью; в prod React просто не emit'ит `printWarning` для `checkForNestedUpdates` — это production-stripped код.

**Counter Maximum-update-depth — ненадёжный индикатор для prod.** Использовать `MutationObserver` на canvas-DOM как объективный замер.

### 4. node_modules — реальный duplicate `@patternfly/react-core` (обновлено 2026-04-27 ночь)

После F.1 (clean reinstall на yarn 3.6.2) точная инвентаризация:
- `react@18.3.1` — **1 instance** (top-level) ✓
- `mobx` — 1 instance ✓
- `zustand` — 1 instance ✓
- **`@patternfly/react-core` — 2 instances** ⚠️
  - `node_modules/@patternfly/react-core@6.4.3` (top-level, используется Kaoto 2.9.0)
  - `node_modules/@kie-tools-core/editor/node_modules/@patternfly/react-core@5.4.14` (nested под транзитивной зависимостью Kaoto)

Kaoto тянет `@kie-tools-core/editor` (workspace-tooling), который пинит старый PatternFly 5.x. Top-level Kaoto работает с PatternFly 6.x. Два разных PatternFly бандлятся в одно приложение → потенциально два разных React-context'а / styled-components регистров / MobX-обёрток у `observerComponent`. Это **новый кандидат в root cause** — согласуется с замечанием §4 о двух разных хешах в Vite optimize-pass.

Vite optimizeDeps собрал bundle с двумя разными хешами (`react.js?v=70102744` vs chunks `?v=d17feaad`) — признак двойного optimize-pass. Дубликат PatternFly это объясняет: Vite видит два пути импорта одного и того же логического модуля.

### 5. Patches IconResolver / Popper — почти бесполезны (§4.1.4)

`useCallback([])` для Popper callback-ref + `setIcon-skip-if-equal` для IconResolver дали -10% к cycle. Это симптомы, не cause.

## Артефакты, созданные в процессе расследования

### Bypass test page (вошло в репо)

- `src/pages/KaotoTest/KaotoTest.jsx` — bare/strict layer-switcher, counter overlay, Reset button.
- `src/index.tsx` — early-bypass-branch для `/v2/kaoto-test*`, минующий весь shell flow (`runApp` / `i18nInit` / `idleTimer` / `serviceWorker`).
- `vite.config.js` — расширен `serveCamelCatalogPlugin` хуком `configurePreviewServer`, чтобы catalog отдавался корректно и в `vite preview` (без этого preview SPA-fallback'ит → 32× JSON SyntaxError).

### Replay-инструменты

В browser console на `/v2/kaoto-test?layer=bare`:
- `window.__kaotoCycleCount` — текущий count `Maximum update depth` warning'ов (только dev).
- `window.__kaotoCycleStart` — timestamp начала отсчёта.
- `window.__kaotoCycleReset()` — сброс counter.

Объективный замер cycle (работает и в prod):

```js
const canvas = document.querySelector('.canvas-page');
let count = 0;
const obs = new MutationObserver(m => count += m.length);
obs.observe(canvas, { childList: true, subtree: true, attributes: true, characterData: true });
setTimeout(() => { obs.disconnect(); console.log('mutations/sec:', count / 30); }, 30000);
```

Здоровое значение — единичные mutations/sec (только при user-actions). 1000+/sec без user-action = cycle.

## Опции, оставшиеся в работе

| Опция | Срок | Статус | Что получаем |
|---|---|---|---|
| ~~A. Binary-search shell~~ | 0.5–2 д | ✅ выполнена, shell не виновник | — |
| ~~B'. Prod-build~~ | 0.5–1 д | ✅ выполнена, не помогает (counter ложный 0) | — |
| ~~B'.1 `optimizeDeps.exclude`~~ | 0.5 ч | ❌ отменена (dev-mode не виновник) | — |
| ~~B'.2 `/* @refresh reset */`~~ | 10 мин | ❌ отменена (dev-mode не виновник) | — |
| ~~F.1. Clean reinstall на текущем yarn 3.6.2~~ | 10–15 мин | ✅ выполнена, не помогла | Lockfile действительно был корраптным (11305 → 20431 строк), PF5 duplicate dead code. Cycle сохранился (1224 vs 1141 mut/sec) |
| ~~F.2. Миграция на yarn 4.x + reinstall~~ | 0.5–1 д | ⚪ отменена после F.1 | F.1 показал, что install-pollution не виновник. Yarn 4.x не добавит новой инфы — строгая peer-dep валидация может вскрыть побочные конфликты, но не cycle |
| ~~G. Deep-dive в MobX Reaction churn~~ | 1–2 ч | ✅ выполнена, амплификатор найден | `setGroupDimensionInitializedByChildren` в PF Topology BaseNode — был промежуточным усилителем, не первопричиной (см. §0) |
| ~~P. patch-package fix `BaseNode.isDimensionsInitialized()`~~ | 1–2 ч | ⚪ **избыточен после R** | Гард amplifier'а; без layout-цикла action дёргается 0.1/сек — patch P больше не нужен |
| ~~R. Анализ исходников Kaoto + upstream check~~ | 1–2 ч | ✅ **выполнена, цикл устранён** | Найден истинный root cause: `RouteVisualization.tsx` useEffect зависит от собственного output. Patch A — identity-preserving reducer (см. §0-NEW). mut/sec = 0.20, cycle/sec = 0 |
| ~~C. iframe-embed Kaoto через postMessage~~ (vscode-kaoto-style) | 3–5 д | ⚪ **больше не нужен** | После Patch A прямой embed работает чисто. Iframe был обходом; теперь архитектурно избыточен |
| ~~E. Узкий MVP с гибридным property-panel~~ | ~1 неделя на add/delete | ⚪ **больше не нужен как fallback** | StepPicker + StepForm прототип остаётся как UX-feature (по желанию), но не как обходной путь для цикла |
| ~~D. Portal в document.body~~ | 1–2 д | ⚪ малоперспективно | Виновник в dep-graph, отдельный mount-tree не помогает |

**Уточнение по F (2026-04-27 вечер):** изначально F стояла как «чистая установка после yarn 4.x». Yarn 4.x сам по себе цикл не лечит — структура `node_modules` под `nodeLinker: node-modules` не меняется между 3.x и 4.x. Реальная диагностическая ценность — в **чистом reinstall** (~80% эффекта), который доступен и на текущем yarn 3.6.2. Yarn 4.x добавляет только строгую peer-dep валидацию, что вторично. Поэтому опция F разделена на F.1 (дешёвый первый ход) и F.2 (вторая итерация).

**Финальный вывод 2026-04-27 (после R):** Истинный root cause — антипаттерн в `RouteVisualization.tsx` (`useEffect` зависит от собственного output state через reducer-новый-ref). Это **внешнее API Kaoto для embedding**; их собственное demo использует `<App>` напрямую без этого хука, поэтому никто из maintainer'ов не сталкивался. Patch A (identity-preserving reducer для `'showFlows'`/`'hideFlows'`) полностью устраняет цикл.

**Текущий путь (после R):**

1. ✅ **Patch A зафиксирован** через yarn-patches → `.yarn/patches/@kaoto-kaoto-npm-2.9.0-656f79ef19.patch`, подключён через `resolutions`. Выживает `yarn install`.
2. ✅ **Patch P (BaseNode) удалён** — без layout-цикла избыточен. Текущий node_modules без guard, `mut/sec = 0.20`, `cycle/sec = 0`.
3. 🟢 **Прямой embed Kaoto в ecos-ui** — рабочий путь. Опции C (iframe) и E (гибрид) больше не требуются как обходные.
4. 🟡 **PR в KaotoIO/kaoto** — отправить Patch A с reproducer'ом и ссылкой на их commit `15ab0413` («the same anti-pattern as fixed in 15ab0413, but for `showFlows`/`hideFlows`»). Это уберёт необходимость держать local patch.

Опции G/P/C/E/F.2 считаются **закрытыми**: root cause устранён точечным патчем, обходные пути не нужны.

## Хронология

- **2026-04-25 (план v3)**: первая фиксация цикла, гипотеза «IconResolver/Popper в Kaoto/PatternFly».
- **2026-04-26**: гибридный property-panel прототип (`StepPicker` + `StepForm` + `yamlSteps`) — workaround для usability.
- **2026-04-27 утро**: уточнение «цикл env-specific» (official demo чистый, наш env churn), гипотеза «shell ecos-ui триггерит».
- **2026-04-27 день**: §4.1.5 опция A — bypass page `/v2/kaoto-test`, замер counter в bare-режиме = 3.43/sec ≈ full shell. Shell исключён. Захвачен реальный stack — MobX Reaction.
- **2026-04-27 вечер**: опция B' — prod-build, counter = 0. Ранний вывод «dev-mode driver». User-report «Add step не работает в prod-build» опроверг это; перезамер через `MutationObserver` показал 1772 mutations/sec в prod. Cycle есть везде, counter был ложным negative.
- **2026-04-27 ночь**: ревизия опции F — yarn 4.x сам по себе цикл не чинит (структура `node_modules` идентична между 3.x и 4.x), диагностический эффект даёт чистый reinstall. F разделена на F.1 (clean reinstall на 3.6.2, 10–15 мин) и F.2 (миграция на yarn 4.x, 0.5 дня).
- **2026-04-27 ночь, F.1 выполнен**:
  - Удалены `package-lock.json` (npm-артефакт от `npm install --legacy-peer-deps`) и `node_modules`.
  - `yarn install` (yarn 3.6.2) пересобрал deps за ~3 минуты.
  - Локальный `yarn.lock` был **корраптнут**: 11305 строк до vs 20431 после vs 18967 в git HEAD. Старый lockfile был неполным — `npm install --legacy-peer-deps` действительно ломал yarn-стейт.
  - Точная инвентаризация: `react`/`mobx`/`zustand` — по 1 копии. **Найден реальный дубликат: `@patternfly/react-core` 6.4.3 (top-level) + 5.4.14 (nested под `@kie-tools-core/editor`)**. Это новый кандидат в root cause — согласуется с двумя хешами в Vite optimize-pass.
  - Следующий шаг: перезамер cycle через `MutationObserver` на `/v2/kaoto-test?layer=bare`. Ожидаемые исходы: (a) cycle ушёл — был просто корраптным lockfile; (b) cycle на месте — PatternFly duplicate реальный виновник, нужен `resolutions` override на 6.4.3.
- **2026-04-27 ночь, замер после F.1** (через Playwright, `/v2/kaoto-test?layer=bare`, React 18.3.1 dev):
  - **1224 mutations/sec** (vs 1141 до F.1) — в пределах шума.
  - **2.95 cycle warnings/sec** (vs 3.4 baseline) — на уровне шума.
  - **Вывод: cycle сохраняется на той же интенсивности.** Гипотеза «npm-pollution создал дубликаты» отвергнута. Корраптный lockfile был реальным артефактом, но не виновником цикла.
  - Остающиеся подозреваемые: дубликат `@patternfly/react-core` 6.4.3 ⇄ 5.4.14 (через `@kie-tools-core/editor`) — следующая проверка.
- **2026-04-27 ночь, проверка PF5 duplicate**:
  - `RouteVisualization.js` импортирует `@patternfly/react-topology`, `Visualization`, providers — НЕ `@kie-tools-core/editor`. Кие-tools используется только в `multiplying-architecture/Bridge` (VS Code embedding API), который наш код не подключает.
  - Grep по `node_modules/.vite/deps/*.js` на маркер `pf-v5-c-` (PF5 CSS-классы) → **0 совпадений**. PF5 из `@kie-tools-core/editor` Vite tree-shak'ает, бандл содержит только PF6.
  - **Гипотеза «дубликат PatternFly = root cause» отвергнута**. PF5 на диске — dead code.
  - **F.1 полностью исчерпан как диагностический инструмент.** Cycle — не от install-pollution.
- **2026-04-27 ночь, опция G (mobx.spy инструментация)**:
  - В `KaotoTest.jsx` добавлен `spy(event => stats[event.type+name]++)` на module-load → доступ к `window.__mobxStatsTop(N)`.
  - Замер 22.5с в bypass-bare показал: **3,327 action calls/sec на `setGroupDimensionInitializedByChildren`** в `@patternfly/react-topology@6.4.0` `BaseNode.isDimensionsInitialized()` — action вызывается из обычного геттера, рекурсивно по дереву нод. Подробности: см. §0.
- **2026-04-27 ночь, опция P (patch-package на BaseNode)**:
  - Патч в `node_modules/@patternfly/react-topology/dist/{esm,js}/elements/BaseNode.js`: добавлен guard `if (this.dimensionsInitialized) return true` в начало `isDimensionsInitialized()`. Vite optimize-deps cache очищен, dev перезапущен.
  - Замер после патча (bypass-bare, 39.1с): **mut/sec = 1285.6** (vs 1224 baseline — без изменений), **cycle warnings/sec = 3.07** (vs 2.95 — без изменений), **mobx events/sec = 18,251** (vs 24,236 — снижение 25%). `setGroupDimensionInitializedByChildren` исчез из топ-8.
  - **Вывод: первая часть бага исправлена (-25% mobx churn), но cycle сохраняется на той же интенсивности.** Patch — частичная победа, не полное решение.
  - Топ-актеры в новом срезе:
    - `action|fromModel`: **82.7/сек** — полная перестройка графа из модели (!)
    - `action|runLayout`: 82.7/сек — re-layout графа
    - `action|setPosition`: 579/сек ≈ 7 нод × 82 layouts
    - `action|registerTarget/Source`: 248 + 165 = 413/сек ≈ 5 edges × 82 layouts
    - `reaction|observer`: 2008/сек (mobx-react re-renders)
  - **Вторая часть бага**: `Canvas.js:42-75` — `useEffect(() => { ... controller.fromModel(model, true); ... }, [controller, entities, visibleFlows])` перезапускается **82.7 раз/сек**. Что-то в deps array нестабильное.
  - Контексты `EntitiesContext` и `VisibleFlowsContext` мемоизированы корректно (`useMemo`). `controller` мемоизирован в `Viz`. Но `<RouteVisualization codeChange={() => {}} />` передаётся новой anonymous функцией каждый render KaotoTest — это триггерит `useLayoutEffect` в `RouteVisualization` через `[eventNotifier, codeChange]` deps. Возможный путь: `codeChange` instability → re-subscribe в RouteVisualization → не должен напрямую triggerить Canvas, но через `entitiesContext.updateEntitiesFromCamelResource` цепочка может закольцеваться.
- **2026-04-27 ночь, эксперимент: useCallback на codeChange**:
  - В `KaotoTest.jsx`: `const codeChange = useCallback(() => {}, [])` (стабилизация callback ref).
  - Замер: **mut/sec = 1336.9, cycle/sec = 3.22, mobx/sec = 18,963** — без изменений.
  - **Вывод: `codeChange` instability — не причина.** Цикл полностью внутри Kaoto/PF Topology, не зависит от пропсов снаружи.
- **2026-04-27 ночь, опция R (анализ исходников Kaoto + upstream check, ЦИКЛ УСТРАНЁН)**:
  - Склонированы исходники `KaotoIO/kaoto` (тег 2.9.0) и `patternfly/react-topology` (тег v6.4.0) в `/Users/antivanov/Documents/workspace-ctk/{kaoto,patternfly-react-topology}`.
  - Прошёл по цепочке: `Canvas.tsx:75 useEffect [controller, entities, visibleFlows] → RouteVisualization.tsx:24 useEffect [visibleFlows, visualFlowsApi]` (вызывает `visualFlowsApi.showFlows()`) → `flows-visibility.ts:55 reducer 'showFlows'` (всегда новый объект через `Object.keys(state).reduce(..., {})`).
  - **Цикл найден на статике**: useEffect зависит от собственного output (reducer new ref → ref change → effect re-run → dispatch → ...). 82.7Hz объясняется RAF-batching на 120Hz мониторе.
  - **Sandbox чист, потому что**: тот же баг присутствует, но без амплификации (нет PF Topology BaseNode action churn вокруг). 10–20 warnings — initial RAF ticks до scheduler bail-out.
  - **Official demo чист, потому что**: `<App>` использует `<Visualization>` напрямую через router/pages, **не `RouteVisualization`**. Эта обёртка — отдельное external API, и баг **только в ней**. vscode-kaoto использует Kaoto через iframe + postMessage — не задевает.
  - **Upstream check**: тот же файл идентичен в `KaotoIO/kaoto@main` (на 2026-04-27). Существует с первого commit'а `0f37c407` (sept 2024). Maintainer (lordrip) применил identity-preserving фикс для `'initVisibleFlows'` в commit `15ab0413` (Oct 2024) с описанием «causing some 'useEffects' to triggered twice», но **не для `'showFlows'`/`'hideFlows'`** — в их `<App>` сценарии это не было нужно.
  - **Применён Patch A** (yarn-patches): identity-preserving check в reducer для `'showFlows'` и `'hideFlows'`. По аналогии с upstream-стилем `15ab0413`.
  - **Замер после Patch A** (с активным Patch P): **mut/sec = 0.90** (vs 1141 baseline — ×1267 reduction), **cycle/sec = 0** ✅, **mobx events/sec = 15** (vs 24,236 — ×1616 reduction). `fromModel`/`runLayout`/`setPosition`/`setGroupDimensionInitializedByChildren` исчезли из top-15.
  - **Замер после Patch A БЕЗ Patch P** (guard убран из BaseNode.js): **mut/sec = 0.20**, **cycle/sec = 0**, **mobx events/sec = 2**, `setGroupDimensionInitializedByChildren` дёргается лишь 0.1/сек (4 раза за 30 сек на initial mount). **Вывод: Patch P избыточен после Patch A** — был эффективен только потому что layout pass'ы шли 77/сек; теперь их нет.

### Сводка замеров по итерациям

| Итерация | mut/sec | cycle/sec | mobx/sec | Δ от baseline |
|---|---:|---:|---:|---|
| Original baseline (до investigation) | 1141 | 3.4 | n/a | — |
| F.1 (clean reinstall) | 1224 | 2.95 | 24,236 | в пределах шума |
| P (patch BaseNode `isDimensionsInitialized`) | 1285 | 3.07 | 18,251 | −25% mobx, mut/sec без изменений |
| Stable codeChange (`useCallback`) | 1336 | 3.22 | 18,963 | без изменений |
| **A (Patch reducer `showFlows`/`hideFlows`) + P** | **0.90** | **0** | **15** | **−99.92% mut, −100% cycle, −99.94% mobx** |
| **A БЕЗ P** (Patch A only, `?layer=bare`) | **0.20** | **0** | **2** | **−99.98% mut, −100% cycle, −99.99% mobx** |
| **A БЕЗ P (`?layer=strict`)** — StrictMode replay | **0** | **0** | **0** | **полная тишина в idle, StrictMode совместим** |

**Цикл полностью устранён точечным фиксом первопричины.** Драйвер — `RouteVisualization.useEffect → showFlows → reducer-new-ref → useEffect re-run → ...` — антипаттерн в external API Kaoto. После Patch A цикла нет ни на одном уровне. Patch P (BaseNode amplifier) после этого избыточен.

## Ссылки

- Основной план: [kaoto-integration-plan.md](../kaoto-integration-plan.md) §4.1, §4.1.1, §4.1.5.
- Sandbox: `kaoto-sandbox/FINDINGS.md` (вне репо ecos-ui).
- Код bypass: `ecos-ui/src/pages/KaotoTest/KaotoTest.jsx`, `ecos-ui/src/index.tsx` (early-branch).
- Vite middleware: `ecos-ui/vite.config.js` `serveCamelCatalogPlugin` (configurePreviewServer-хук).
- Upstream issues контекст (не корень): KaotoIO/kaoto#1623 #1626 #2116, patternfly-react#8733, floating-ui/react-popper#250, radix-ui/primitives#2152 #3799, mui/base-ui#3275, mobxjs/mobx#3728.
