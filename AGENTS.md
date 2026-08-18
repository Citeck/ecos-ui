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

# Import graph
yarn check:cycles       # madge --circular over src and packages
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

`src/components/ai/AIAssistant/__tests__/i18nKeys.test.js` fails the suite when a key of the AI families (`ai-actions.`, `ai-agent.`, `ai-assistant.`, `ai-code-diff.`, `ai-content-service.`, `ai-html-diff.`, `script-context.`, `script-diff.`, `text-context.`) exists in one locale only, has an empty value, or is asked for by a component and translated in neither. A new key prefix in that family must be added to its `AI_KEY_PREFIXES` — a prefix left out is exempt from every assertion in the file, so the list is the test's actual coverage.

### Workspace packages

Shared, app-agnostic code lives in `packages/` (Yarn workspaces), imported via `@citeck/*` aliases (configured in `vite.config.js`, `tsconfig.json`, `jest.config.js`):

- `@citeck/records-core` — Records API (query/get/mutate, predicates, types). Default import: `import Records from '@citeck/records-core'`. Predicates: `@citeck/records-core/predicates`.
- `@citeck/records-predicates` — predicate helpers.
- `@citeck/constants` — app-wide constants (`URL`, `SourcesId`, `SystemJournals`, etc.). Subpaths mirror files: `@citeck/constants/menu`, `@citeck/constants/alfresco`, … Replaces the former `src/constants`.

Records actions/handlers stay in the web app at `@/components/core/Records/actions/…`.

### Widget plugins

Some dashboard widgets are not part of this repo: they live in their own `ecos-ui-*-widget-plugin`
repositories and are picked up from `src/plugins/` by `import.meta.glob` (`src/plugins/index.js`),
then registered in `src/components/dashboard/widgets/Components.js` behind a
`window.Citeck.Plugins.<Name>` check. `.gitignore` ignores `src/plugins/*` and whitelists only a few
of them, so a plugin such as `ecos-ui-activities-widget-plugin` is present there as an untracked
working copy — a change to it belongs in the plugin repository, and the copy under `src/plugins/`
is refreshed from it (`rsync -a --delete --exclude='.git/' <plugin-repo>/ src/plugins/<plugin>/`)
so the dev server and the build see it. Bump the plugin's `package.json` version in the same commit,
the way `COREDEV-354` did.

A plugin imports the app through relative paths out of `src/plugins/<plugin>/…`, and reuses the
styles of the widget it is modelled on (the activities widget imports `Comments/style.scss`) — but
only the shared, unprefixed classes carry over: its own footer, list and editor use an
`ecos-activities__…` prefix with its own rules, so a fix to the comments widget has to be ported by
hand.

### Path alias

`@/` maps to `src/` (configured in `vite.config.js` and `tsconfig.json`). Use `@/` for cross-directory imports; use `@citeck/*` for the workspace packages above.

### Styling

SCSS with modern compiler (`quietDeps: true`). Component-scoped `.scss` files alongside components.

Icons come from two families that size differently, and a row mixing them only looks even if both
are matched to one *ink* box. An inline SVG paints its viewBox scaled into `width`/`height`, so any
padding inside the viewBox shrinks the drawing — the icon components under `common/icons` therefore
crop their viewBox to the ink, on integer coordinates, and let the caller pass the box
(`VIEW_TAB_ICON_BOX` in `journals/Journals/ViewTabs.jsx`; the journal view-mode icons share a 20x18
grid). Only the *height* of that box is sacred — it is what lines the row up. Stretching a drawing
to the full box width distorts shapes that are naturally narrower: the hierarchy tree filled at
20x18 read as horizontally stretched, and review settled on 17x18 ink — a unit taller than wide
(round two of COREDEV-349). Fractional coordinates are the trap: a shape whose edge lands
mid-pixel renders that row at a few percent coverage, which reads as a gap next to a crisp
neighbour.

A `citeck` font glyph cannot be pixel-aligned with an SVG at all: its ink sits on fractional
pixels of the em box (`icon-list` painted rows 10.75..28.75 for integer SVG neighbours at 11..29)
and the browser snaps text to whole-pixel positions, so no fractional CSS nudge moves it — offsets
round to the nearest pixel. The journal header therefore uses no glyphs: `icon-list`,
`icon-kanban` and `icon-folder` are drawn by `icons/List.tsx`, `Kanban.tsx` and `Folder.tsx`. The
remaining vertical rule is that an inline SVG sits on its wrapper's text baseline, so the wrapper
leaves inline layout to centre it (`ViewTabs.scss`). All of this is COREDEV-349;
`__tests__/ViewTabs.test.js` guards it.

### Component conventions

`src/components/` is grouped into 10 category folders — `admin`, `ai`, `common`, `core`, `dashboard`, `domain`, `editors`, `forms`, `journals`, `layout` — each holding related feature folders (e.g. `layout/App`, `core/Records`, `dashboard/widgets`, `editors/ModelEditor`). Cross-folder imports use the `@/` alias, never deep relative paths.

- Larger container components: class components with `connect(mapStateToProps, mapDispatchToProps)`
- Smaller presentational components: functional components with hooks
- Files are a mix of `.jsx` and `.tsx` (gradual migration to TypeScript)
- PropTypes used for prop validation in JS components
- Icon-only buttons need an explicit `aria-label`. `data-tooltip` is drawn by a CSS pseudo-element and contributes no accessible name at all — and only where the `tooltip` mixin (`ai/AIAssistant/styles/_mixins.scss`) or an equivalent rule is actually applied to that class, so the attribute alone renders nothing. Playwright acceptance addresses these controls by role + name.
- A styled tooltip is four parts, not one, and three of them are easy to leave out. (1) `@include tooltip($position)` on the button's own class — `top` by default, `bottom` for a button at the top edge of a clipping container. (2) `position: relative` on that button, or the bubble anchors to whatever ancestor is positioned. (3) A right-edge override (`&::after { left: auto; right: 0; transform: translateX(0) }`, plus the matching `::before`) for the last button in a row: the bubble is `white-space: nowrap` and centred, so it sticks out past the panel and is cut — this is the exception that keeps recurring, and it is already written out three times (`_chat-input.scss` `--clear-context`, `_chat-base.scss` `__close`, `_ai-quick-actions.scss` `__retry-submit`). (4) `overflow: visible` on the clipping ancestor. Flipping an already-styled tooltip to the other side takes `@include tooltip-direction(top|bottom)` alone, which is what the minimized panel does — re-including the whole `tooltip` mixin would leave `top` and `bottom` both set and stretch the bubble. Lifting a container's clipping is not the end of it: the window itself clips too, and there is no `title` left to fall back on.
- `IcoBtn` spreads its remaining `...props` straight onto `<button>`, so any prop it takes that is not a DOM attribute has to be destructured out explicitly (`icon` is). Adding one and forgetting leaks it into the markup of ~60 call sites. When checking that nothing depended on such a leaked attribute, grep `__snapshots__` as well as `expect`/selectors — a committed snapshot captures the rendered attribute and is the one thing that fails.

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

The universal chat survives a page reload through `chatSessionStorage.js` (`sessionStorage`, key `aiAssistantChatSession`, record `{conversationId, requestId, agent, owner, savedAt}`):

- `sessionStorage` and not `localStorage`, so two independently opened tabs cannot overwrite each other's conversation. It is scoped per browsing context, not per tab: a tab *duplicated* from this one inherits a copy of the record and may resume the same request once more — accepted, and written down in the module doc so it is not "fixed" by a tab token, which would be regenerated on the very reload the persistence exists for. The record is written the moment a `requestId` exists (`handleSubmit`, `handleActionClick`), and the `requestId` is dropped on **every** terminal path — `handlePollingResult`, `handlePollingError` (the `meta.requestLost` 404 included), `handlePollingCancelled`, and after a *confirmed* cancel DELETE, never before it. Miss one and the next reload resumes a request the server has already retired. `clearSession()` runs on the two outcomes that reset the hook — the DELETE's `ok` **and** its 404 (`resetConversationState`) — and on no other: a 404 means the backend does not hold the conversation any more, so keeping the id would restore a dead one on every reload, while any other refusal leaves the hook on the old conversation and the storage must not disagree with it.
- The two expiry horizons in `constants.js` come from citeck-ai and are **not** interchangeable. `CHAT_SESSION_TTL_MS` (24 h) mirrors `ConversationDataStore.DATA_EXPIRY_HOURS`; `CHAT_REQUEST_RESUME_TTL_MS` (90 min) mirrors `REQUEST_TIMEOUT_MINUTES` (30) plus `COMPLETED_RETENTION_MINUTES` (60) in `UniversalAssistantController`. Tying either to the client's polling watchdog (`POLLING_INTERVAL * POLLING_MAX_ATTEMPTS`, ~10 min) throws away exactly the long generations the persistence exists to rescue.
- The record carries the `owner` it was written for. `sessionStorage` outlives a logout in the same tab, and `ConversationOwnerGuard` in citeck-ai answers 404 to everybody but the owner — including the DELETE behind "clear chat" — so an inherited `conversationId` wedges the next user's chat with no way out from the interface. A blank user on either side is not a mismatch: `Citeck.constants.USERNAME` is not populated everywhere, and the backend guard lets a blank user through too.
- The selected agent travels **with** the conversation, in the same record. The binding is server-side — `AgentOrchestratorService.resolveAgentRef` (citeck-ai) answers from the `AGENT_REF` stored on the conversation for every question that sends none — so a conversation restored without its agent does not go back to the default assistant, it only stops saying who is answering. Only `{id, name, engine}` are stored (the request's `agentRef`, the chip's label and its icon); the dropdown reloads the full list from the backend anyway. Two consequences carry over to whoever restores more: the message list is deliberately **not** restored (решение 1 in the plan), so `hasMessages` alone cannot decide whether there is a dialog worth confirming the loss of — `AIAssistantChat` passes `hasRestoredConversation` to `AgentSelector` next to it, or switching agents would silently `DELETE` a live conversation whose history the user cannot see. Both entry points into a switch go through `applyAgentSwitch` (`utils.js`): the selector dropdown, and the «Настроить платформу» shortcut on the welcome screen — which is on show exactly when the message list is empty, i.e. after every reload. A raw setter behind either of them rebinds the restored conversation with no confirmation and no `DELETE`. The rule the helper holds is one-sided: only a chat that *has* a dialog is left unswitched by a refused clearing, because a chat that has never been used owns a `conversationId` the backend has never seen, and gating on that DELETE took away the only way to pick an agent while the service was unreachable.
- Restoration is triggered by the panel becoming **visible** (`useWindowManagement().isVisible`, passed into `useUniversalChat` as `isOpen`), never by the hook mounting or by `isOpen` alone: `AIAssistantService.toggleChat` minimizes an open panel instead of closing it, so the toolbar button, the `Alt+I` shortcut and the header minimize button all leave `isOpen` true — and keyed on it, the chat's own advice after a failed poll («закройте и снова откройте панель») was answered by nothing but the `×` in the header. `AIAssistantContainer` renders on every page, so a mount-bound effect would poll on pages where the chat was never opened. The effect is latched by a `useRef` — StrictMode runs mount effects twice, and closing and reopening the panel would otherwise resume the same request again. The latch is *not* one-shot for the life of the page: `handlePollingError` lowers it on a `requestAlive` failure, so reopening the panel is a way back to a turn whose poll gave up. That is why the effect also refuses to run while `activeRequestId` is set — otherwise the lowered latch would let a reopen restore the *next* turn's id (the record has been overwritten by then) on top of its own live poll, appending a second processing card and restarting the poll with the watchdog counter back at zero. `isLoading` is in the same guard and is not redundant: `activeRequestId` is set by `startPolling`, which runs only once `POST /universal/async` has answered, so a question still travelling to the backend is invisible to it while the record still holds the *previous* turn's id. Both `handleSubmit` and `handleActionClick` raise `isLoading` before their first await, which is what makes it the whole-turn flag the guard needs. Because the latch may come down again, `usePolling` re-arms a poll started during a first StrictMode setup and killed by its own cleanup (`pendingPollRef` + the mount effect); a caller may therefore call `startPolling` from an effect without checking whether the timer survived. Arm timers only through `schedulePoll` and end polling only through `finishPolling`, or the two will disagree about what is running.
- `clearConversation` calls `stopPolling()` and `setIsLoading(false)`: nothing disables the clear button while a request runs, and a surviving poll drops its answer into the chat the user has just emptied. `stopPolling` covers only a request that is already being polled — a turn whose `POST /universal/async` has not answered yet is retired by `conversationGenerationRef`, which `handleSubmit`/`handleActionClick` check after every await before touching storage, polling or messages.
- A double-submit guard is a `useRef`, not state (`hooks/useEmailSend.js`): state is applied asynchronously and the value captured by `useCallback` stays frozen until the next render, so two clicks in one render cycle both read `false`. Whatever closes the form must lower that ref and retire the in-flight request by a generation counter — otherwise the next draft's Send is a silent no-op, and the abandoned request's completion wipes the draft the user is composing.
- Record references are not normalised across their sources: the current record arrives as the `recordRef` URL parameter (`emodel/type@id`) while search results carry `record.id` as the server returned it (`type@id`). Compare with `isSameRecordRef` from `utils.js`, never with `===`. It strips only the application prefix — the first `/` *before* the `@` — because a local id may hold slashes of its own (`alfresco/@workspace://SpacesStore/id`), and only from the side that has one: dropped from both, `emodel/contract@id` and `alfresco/contract@id` compared equal, and every caller turns that into a silent drop (the record vanishes from the `@` list, is refused entry to the context, or is filtered out of the auto-context chips). It does **not** normalise the other difference: a reference read from the page address may carry an `-alias-<alias>` suffix, which is a routing detail of that address and not part of the record's identity. Pass every reference read from a URL through `stripRecordRefAlias` (same `utils.js`) — never open-code the cut, so the rule stays in one place. Skip it and the two spellings of the same record are compared as two records: the current record is offered by the `@` dropdown although its chip is on screen, and is sent twice (D-B-18).
- `getScriptContextLabel` (`constants.js`) must never return a raw identifier: an unknown type falls back to `script-context.default`. Its `TEXT_CONTEXT_TYPE_LIST` duplicates the `TEXT_CONTEXT_TYPES` table in `TextAIService.ts` — that service imports `constants.js`, so importing the list back would close a cycle. The names differ on purpose: `TextAIService.ts` already exports `TEXT_CONTEXT_TYPES` as a *table* (`{ GENERAL: 'general', … }`, re-exported by `index.js`), and two same-named exports of incompatible shape fail silently: `TEXT_CONTEXT_TYPES.GENERAL` resolved against a plain array is `undefined`, which is exactly what `TextArea.jsx` passes as its fallback context type. The two lists are held together by an assertion in `getScriptContextLabel.test.js`, because on drift a text type falls through to the *script* fallback and labels a text field "Скрипт". A new text context type goes into **both** files plus a `text-context.<type>` key in both locales.
- Escape on the chat panel is handled on `document` (`useWindowManagement.js`) and closes the whole panel unconditionally. Any popup rendered inside the chat must call `e.stopPropagation()` in its own Escape branch, or one press closes the panel instead of the popup (D-405-5, fixed in `useAutocomplete.js`). Stopping propagation from a React handler is enough: the app mounts through `createRoot` and the chat renders into a body-level portal, so React 18's delegated listeners sit below `document`. The agent dropdown, the export menu and the email modal have **no** Escape handling yet — adding one to any of them means adding the `stopPropagation` with it. The other half of the rule: consume the key only while the popup is actually on screen. An `@` whose query matches nothing leaves `showAutocomplete` true with the list rendering nothing, and swallowing Escape there spends the press on an invisible popup — hence `isAutocompleteListVisible`, which the render and the key handler share so they cannot disagree.

#### AI quick actions (`src/components/ai/AIAssistant/AIQuickActions`)

- An action may only be configured on a field type that some component actually mounts: `TextArea.jsx` mounts `TEXTAREA` and `DOCUMENTATION`, Lexical mounts `RICHTEXT`, the script editor mounts `CODE`. `FIELD_TYPES.TEXT` and `FIELD_TYPES.NAME` are declared but mounted by nothing, so an action listed only under them looks covered and has no UI entry point at all. This has happened twice — `simplify`/`formalize` (D-B-2) and `translate` — and is guarded by the `it.each` over the mounted types in `config/__tests__/fieldActionConfigs.test.ts`.
- A new action has to be added in three places, each failing silently on its own: `FIELD_ACTION_CONFIGS` (`config/fieldActionConfigs.ts`), `getDefaultPromptForAction` (`hooks/useAIFieldActions.ts` — an unmapped id falls back to the *improve* prompt), and `mapActionId` (`TextAreaAIButton.jsx` — an unmapped id is passed through raw). The action id is the key the backend resolves the prompt file by (`TextQuickActionsProvider`), so it is not free to rename.

### Key services

- `src/services/auth.ts` — Keycloak authentication
- `src/services/config/ConfigService` — app configuration values
- `src/services/notifications/NotificationManager` — toast notifications
- `src/services/pageTabs/PageTabList` — browser tab management

### Notable integrations

- **BPMN/DMN editors** — bpmn-js, dmn-js (mocked in Jest)
- **Kaoto Camel DSL editor** — `@kaoto/kaoto` 2.9.0 (pinned: 2.10+ requires React 19). Patched via yarn-berry (`.yarn/patches/@kaoto-kaoto-npm-2.9.0-*.patch`) to fix Maximum-update-depth-cycle and add `initialFilterTags` prop. Camel catalog extended via `public/camel-catalog-overrides/components.json` (Citeck schemes) + `allowlist.json` (Apache schemes filter); merge logic lives in `serveCamelCatalogPlugin` (`vite.config.js` + `vite-plugins/camelCatalogAllowlist.js`). Do NOT wrap Kaoto components in `React.StrictMode`.
- **Forms** — Formio 3 with custom components. Gotcha: `PanelComponent` builds its root element by hand (`mb-2 card border panel panel-<theme>`) instead of going through `Base.createElement`, so a panel is the one component that never gets a `formio-component-panel` class. Style panels through `.card.panel` — a selector that assumes the `formio-component-*` naming silently matches nothing (that is how COREDEV-403 lost the gap above a panel header). `Panel.spec.js` asserts the view-mode gap selector still matches a rendered panel.

  The `ecosSelect` and the overridden `select` are the only two components built on **choices.js**,
  and their markup is the library's, not ours: a multi-value chip is
  `div.choices__item > span` + `button.choices__button`, where the `<span>` comes from the
  component's `template` option. `formio.full.min.css` lays that chip out as an `inline-block` with
  `word-break: break-all` and no width cap, so anything that has to fit on one line has to be
  restated in `components/override/select/select.scss` — that is how a label wider than the field
  came to wrap and drop its ✕ onto a second line (COREDEV-14). Two traps in that block: the remove
  button needs `min-width: 0` once it is a flex item, or its automatic minimum size restores the
  width of the label choices.js hides behind `text-indent: -9999px`; and the empty-chip rule in
  `forms/choices/style.scss` (`:has(> span:empty)`, specificity `(0,2,1)`) loses to anything written
  under the `.formio-form .formio-component-*` scope, so it must be repeated there. Because jsdom
  has no layout, `EcosSelect.spec.js` guards the *markup* those selectors are written against
  rather than the geometry. Full write-up: `docs/select-multiple-chips-layout.md`.
- **Rich text** — Lexical editor with Yjs collaboration
- **Auth** — Keycloak 26
- **Popper 2** (`@popperjs/core` 2 via `react-popper`) — `common/Tooltip` still speaks some of the Popper 1 vocabulary. Watch the option *values*, not just the names: `preventOverflow`'s `boundary` takes an element or `clippingParents`, so the inherited `boundariesElement: 'window' | 'viewport' | 'scrollParent'` strings are read as elements and the modifier silently does nothing — which is how tooltips near the right edge of the screen came to push the document wider and raise global scrollbars. Popper 2 fails quietly on a bad option; verify a modifier by measuring the rendered position, not by reading the config.

### Testing

Jest + jsdom. Config in `jest.config.js`. Heavy mocking for BPMN libs, diagram-js, react-markdown. CSS and image imports are auto-mocked. `@citeck/*` packages are mapped to `packages/*/src` via `moduleNameMapper`.

**Gotcha:** the `bpmn-js*` / `BPMN*` / `diagram-js*` stub mappings must stay **before** the `@/(.*)$` catch-all in `moduleNameMapper` — otherwise `@/`-aliased imports whose path contains `BPMN` resolve the real (heavy, unmocked) modeler code in jsdom and the suite fails to load.
