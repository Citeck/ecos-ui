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

To run a single test file:
```bash
yarn test -- path/to/file.test.js
```

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

### Key services

- `src/services/auth.ts` — Keycloak authentication
- `src/services/config/ConfigService` — app configuration values
- `src/services/notifications/NotificationManager` — toast notifications
- `src/services/pageTabs/PageTabList` — browser tab management

### Notable integrations

- **BPMN/DMN editors** — bpmn-js, dmn-js (mocked in Jest)
- **Kaoto Camel DSL editor** — `@kaoto/kaoto` 2.9.0 (pinned: 2.10+ requires React 19). Patched via yarn-berry (`.yarn/patches/@kaoto-kaoto-npm-2.9.0-*.patch`) to fix Maximum-update-depth-cycle and add `initialFilterTags` prop. Camel catalog extended via `public/camel-catalog-overrides/components.json` (Citeck schemes) + `allowlist.json` (Apache schemes filter); merge logic lives in `serveCamelCatalogPlugin` (`vite.config.js` + `vite-plugins/camelCatalogAllowlist.js`). Do NOT wrap Kaoto components in `React.StrictMode`.
- **Forms** — Formio 3 with custom components
- **Rich text** — Lexical editor with Yjs collaboration
- **Auth** — Keycloak 26

### Testing

Jest + jsdom. Config in `jest.config.js`. Heavy mocking for BPMN libs, diagram-js, react-markdown. CSS and image imports are auto-mocked. `@citeck/*` packages are mapped to `packages/*/src` via `moduleNameMapper`.

**Gotcha:** the `bpmn-js*` / `BPMN*` / `diagram-js*` stub mappings must stay **before** the `@/(.*)$` catch-all in `moduleNameMapper` — otherwise `@/`-aliased imports whose path contains `BPMN` resolve the real (heavy, unmocked) modeler code in jsdom and the suite fails to load.
