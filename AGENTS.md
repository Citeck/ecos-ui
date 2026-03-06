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

React Router 5 + connected-react-router. Routes defined in `src/components/App/App.jsx`. URL path constants in `src/constants/index.js` (`URL` object). All app routes are under `/v2/`.

### API

Domain-specific clients in `src/api/`. Called exclusively from sagas.

### Localization

i18next with `src/i18n/en.json` and `src/i18n/ru.json`. Use `t('key')` from `@/helpers/util`. Always add keys to **both** locale files.

### Path alias

`@/` maps to `src/` (configured in `vite.config.js` and `tsconfig.json`). Always use `@/` for cross-directory imports.

### Styling

SCSS with modern compiler (`quietDeps: true`). Component-scoped `.scss` files alongside components.

### Component conventions

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
- **Forms** — Formio 3 with custom components
- **Rich text** — Lexical editor with Yjs collaboration
- **Auth** — Keycloak 26

### Testing

Jest + jsdom. Config in `jest.config.js`. Heavy mocking for BPMN libs, diagram-js, react-markdown. CSS and image imports are auto-mocked.
