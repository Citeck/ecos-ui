## Commands

**Package manager:** Yarn 3.6.2 (npm is disabled). Node 20 required.

```bash
# Development
yarn start              # Dev server
yarn start:stage        # Staging dev server

# Build
yarn build              # Production build
yarn build:stage        # Staging build

# Testing
yarn test               # Jest watch mode
yarn test:ci            # Jest (no watch, for CI)

# Code formatting
yarn format             # Prettier (single quotes)
```

To run a single test file (or a whole folder — the argument is a Jest path pattern):
```bash
yarn test:ci src/components/ai/AIAssistant/__tests__/MessageList.test.js
yarn test:ci src/components/ai/AIAssistant
```

`yarn test` is watch mode and never exits — use `yarn test:ci` for CI and for any automated run.

There is no `lint` script; run ESLint directly on the changed files:
```bash
DISABLE_V8_COMPILE_CACHE=1 npx eslint $(git diff --name-only develop...HEAD -- '*.js' '*.jsx' '*.ts' '*.tsx')
```

**Gotcha:** `DISABLE_V8_COMPILE_CACHE=1` is required on Node 22 — `bin/eslint.js` loads `v8-compile-cache`, which breaks `require(esm)` for `async-function` and fails with `Cannot use import statement outside a module`.

## Architecture

Enterprise content & operations platform UI (Citeck). React 18 + Redux + Redux-Saga + TypeScript + Vite 7.

### Entry point

`src/index.tsx` — initializes auth (Keycloak), i18n, configures the API, creates the Redux store, and renders the app inside `ConnectedRouter`.

### Redux pattern

Domain-specific modules in parallel directories:
- `src/actions/` — action creators (redux-actions)
- `src/reducers/` — pure reducers (`handleActions`)
- `src/sagas/` — side effects (async API calls, `takeLatest`/`takeEvery`)
- `src/selectors/` — state selectors (lodash `get`, optionally reselect)

Sagas receive the `api` object via Redux middleware extra argument (dependency injection). Store supports async reducer injection.

### Routing

React Router 5 + connected-react-router. Routes defined in `src/components/layout/App/App.jsx`. URL path constants in `@citeck/constants` (`URL` object). All app routes are under `/v2/`.

### API

Domain-specific clients in `src/api/`. Called exclusively from sagas.

An API client's attribute map is a *domain* schema, not a shared vocabulary: the same alias can name
different attributes in two of them. `OrgStructApi.userAttributes.fullName` is `authorityName` (the
login of an authority in the orgstruct tree), while `UserApi.attributes.fullName` is the person's
name attribute. `UserApi.getUserData` merges `{ ...this.attributes, ...attrs }`, so a caller passing
another client's map silently redefines the overlapping aliases — that is how the header came to show
the login (COREDEV-384, guarded by `src/sagas/__tests__/app.test.js`). Pass an explicitly reconciled
map, not another domain's schema.

Wherever the UI names a person it shows the platform display name (`?disp`), not a name assembled
from `firstName`/`lastName` — that is what comments, activities, orgstruct and the header
(`state.user.displayName`) all render, so a customized display-name template stays consistent
everywhere.

### Localization

i18next with `src/i18n/en.json` and `src/i18n/ru.json`. Use `t('key')` from `@/helpers/util`. Always add keys to **both** locale files.

### Workspace packages

Shared, app-agnostic code lives in `packages/` (Yarn workspaces), imported via `@citeck/*` aliases (configured in `vite.config.js`, `tsconfig.json`, `jest.config.js`):

- `@citeck/records-core` — Records API (query/get/mutate, predicates, types). Default import: `import Records from '@citeck/records-core'`. Predicates: `@citeck/records-core/predicates`.
- `@citeck/records-predicates` — predicate helpers.
- `@citeck/constants` — app-wide constants (`URL`, `SourcesId`, `SystemJournals`, etc.). Subpaths mirror files: `@citeck/constants/menu`, `@citeck/constants/alfresco`, … Replaces the former `src/constants`.

Records actions/handlers stay in the web app at `@/components/core/Records/actions/…`.

### Path alias

`@/` maps to `src/` (configured in `vite.config.js` and `tsconfig.json`). Use `@/` for cross-directory imports; use `@citeck/*` for the workspace packages above.

### Styling

SCSS with modern compiler (`quietDeps: true`). Component-scoped `.scss` files alongside components.

### Component conventions

`src/components/` is grouped into 10 category folders — `admin`, `ai`, `common`, `core`, `dashboard`, `domain`, `editors`, `forms`, `journals`, `layout` — each holding related feature folders (e.g. `layout/App`, `core/Records`, `dashboard/widgets`, `editors/ModelEditor`). Cross-folder imports use the `@/` alias, never deep relative paths.

- Larger container components: class components with `connect(mapStateToProps, mapDispatchToProps)`
- Smaller presentational components: functional components with hooks
- Files are a mix of `.jsx` and `.tsx` (gradual migration to TypeScript)
- PropTypes used for prop validation in JS components

#### AI assistant chat (`src/components/ai/AIAssistant`)

The liveness of a HITL gate (its action buttons and the hint under a plan card) is **derived at render, never stored**:

- `isGateStale(messages, index)` in `utils.js` is the single source of truth. `MessageList` computes it for the whole list and passes three props to `MessageItem`, which **must forward all three to every branch that renders a gate**: `actionsDisabled = stale || isLoading` and `actionsFrozen = isLoading` reach `MessageActions` — a new message type that forgets them silently makes superseded gates clickable again — while `actionsStale = stale` is staleness without the freeze folded in and drives what a card *displays* (the hint under a plan card, the deploy scope a confirmation reports). Mixing the freeze into the displayed state makes every card claim a decision it has not taken for the length of each round trip.
- A message is addressed by `messageId` (`onActionClick(actionId, { messageId })`), never by `action.id`: `CONFIRM` / `REJECT` / `SKIP` / `ABORT` / `deploy_confirm` repeat across messages, and escalation gates reuse the ids of the gate they escalate.
- `handleActionClick` sets `messageData.actionsResolved = true` after a successful response instead of clearing `actions`, so the history keeps showing the choice that was offered. On a failed request the flag stays unset and the trailing `isError` notice does not count as a newer message, so the same button can be pressed again.
- Exception: file-save actions (`<base>|<tempRef>`) are resource-scoped, not dialog-scoped — several proposed files may await a decision at once. A set made entirely of them never goes stale; in a mixed set (the backend merges a file's Save/Cancel pair onto the gate produced by the same turn) `MessageActions` keeps just those buttons live. The in-flight freeze applies to them too.
- What ends that exemption is `messageData.resolvedFileTempRefs`, not `actionsResolved`: one message may carry the pairs of several files, so a per-message flag cannot say which of them is decided. Its two writers are `handleActionClick` (the clicked `tempRef`, retiring every copy of that pair in the history) and `handlePollingResult` (every `tempRef` missing from `result.pendingFiles`, the backend's live snapshot). The snapshot is trusted whenever it is an array, `[]` included — an empty list explicitly states that no proposal is left, which is what retires the buttons of files that died without their own click. Only `null` means "no information", and then only the `tempRef` the response answers may be retired, never the rest of the history. Dropping either writer brings back a Save button for a temp file the backend has already deleted.
- The answer to a file-save click never supersedes a gate either: the backend resolves that request before it reaches the agent, so `handlePollingResult` stamps the resulting message `isFileActionNotice` (and keeps the current `agentStatus`), and `isSupersededByNewerMessage` skips it exactly like an `isError` notice. Without it, saving the file half of a mixed set would disable the `CONFIRM` the agent is still waiting for.
- Anything a resolved gate must keep displaying belongs on the message, not in a message component's state: the whole list is unmounted while the chat window is minimized (`AIAssistantChat`: `{!isMinimized && …}`). This is why the confirmed deploy scope travels as `deployScopeOption` in the action payload and is stored by `handleActionClick` as `messageData.sentDeployScope`.
- `ResizableBox` from `react-resizable@3` spreads unknown props onto its inner `<div>`, so resizing is switched off with an empty `resizeHandles` list, not with a custom prop. `AIAssistantChat` is the only direct consumer of `react-resizable`; everything else uses the in-house `@/components/common/ResizableBox`.

### Key services

- `src/services/auth.ts` — Keycloak authentication
- `src/services/config/ConfigService` — app configuration values
- `src/services/notifications/NotificationManager` — toast notifications
- `src/services/pageTabs/PageTabList` — browser tab management

### Notable integrations

- **BPMN/DMN editors** — bpmn-js, dmn-js (mocked in Jest)
- **Kaoto Camel DSL editor** — `@kaoto/kaoto` 2.9.0 (pinned: 2.10+ requires React 19). Patched via yarn-berry (`.yarn/patches/@kaoto-kaoto-npm-2.9.0-*.patch`) to fix Maximum-update-depth-cycle and add `initialFilterTags` prop. Camel catalog extended via `public/camel-catalog-overrides/components.json` (Citeck schemes) + `allowlist.json` (Apache schemes filter); merge logic lives in `serveCamelCatalogPlugin` (`vite.config.js` + `vite-plugins/camelCatalogAllowlist.js`). Do NOT wrap Kaoto components in `React.StrictMode`.
- **Forms** — Formio 3 with custom components. Gotcha: `PanelComponent` builds its root element by hand (`mb-2 card border panel panel-<theme>`) instead of going through `Base.createElement`, so a panel is the one component that never gets a `formio-component-panel` class. Style panels through `.card.panel` — a selector that assumes the `formio-component-*` naming silently matches nothing (that is how COREDEV-403 lost the gap above a panel header). `Panel.spec.js` asserts the view-mode gap selector still matches a rendered panel.
- **Rich text** — Lexical editor with Yjs collaboration
- **Auth** — Keycloak 26

### Testing

Jest + jsdom. Config in `jest.config.js`. Heavy mocking for BPMN libs, diagram-js, react-markdown. CSS and image imports are auto-mocked. `@citeck/*` packages are mapped to `packages/*/src` via `moduleNameMapper`.

**Gotcha:** the `bpmn-js*` / `BPMN*` / `diagram-js*` stub mappings must stay **before** the `@/(.*)$` catch-all in `moduleNameMapper` — otherwise `@/`-aliased imports whose path contains `BPMN` resolve the real (heavy, unmocked) modeler code in jsdom and the suite fails to load.
