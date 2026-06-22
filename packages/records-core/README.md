# @citeck/records-core

Platform-agnostic SDK for the **Citeck Records API** — query / mutate / delete records,
a record cache with lazy attribute loading, watchers, and predicate helpers.

The core has **zero** browser or framework dependencies (`window`, `document`,
`localStorage`, `fetch`, i18n are never touched directly). Everything platform-specific
is injected via `configure()`, so the same package runs in the browser, in **React Native**,
and in Node.

## Install

```sh
yarn add @citeck/records-core
```

Runtime deps: `lodash`, `moment`, `query-string`, `uuidv4`, `js-base64`, `events`.

## Configure (once, at startup)

```ts
import { configure } from '@citeck/records-core';

configure({
  http,        // (url, { method, body, signal }) => Promise<HttpResponse>
  i18n,        // { t(key, params?) => string }
  workspace,   // { getWorkspaceId(), getEnabledWorkspaces(), getCurrentRecordRef?() }
  storage      // optional { getItem(key) } — debug feature flag
});
```

### Web (ecos-ui)

See [`src/services/records/recordsBootstrap.ts`](../../src/services/records/recordsBootstrap.ts):
HTTP via `ecosFetch`, i18n via `t`, workspace from app helpers, plus `registerGlobal()`
(exposes `window.Citeck.Records`) and the browser-only CAPICOM cipher client.

### React Native

```ts
import { configure } from '@citeck/records-core';

configure({
  http: (url, { method, body, signal }) =>
    fetch(`${API_HOST}${url}`, { method, signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  i18n: { t: key => translate(key) },
  workspace: { getWorkspaceId: () => 'default', getEnabledWorkspaces: () => false }
});
```

## Use

```ts
import Records from '@citeck/records-core';

const record = Records.get('emodel/person@admin');
const name = await record.load('cm:name');

const { records } = await Records.query(
  { sourceId: 'emodel/person', query: { t: 'eq', att: 'active', val: true } },
  { name: 'cm:name', email: 'emodel:email' }
);
```

## What is NOT here

UI- and web-coupled pieces stay in the host app, not the SDK:

- **Record actions** (`actions/`) — dialogs, forms, downloads, navigation.
- **CipherSwpGostClient** — CAPICOM (`window.cadesplugin`); register it via
  `recordsClientManager.register(...)` on the web only.
- **`getPredicateInput`** — React form-control mapping for filters. Pure predicate
  helpers (`convertValueByType`, `convertAttributeValues`, constants) ARE exported here.

## Build

```sh
yarn workspace @citeck/records-core build   # tsup -> dist (ESM + CJS + .d.ts)
yarn workspace @citeck/records-core typecheck
```

## Extraction to a standalone repo (deliverable)

This package is developed inside the `ecos-ui` monorepo (`packages/records-core`) and
consumed via path alias during staging. To ship it for reuse in other repos
(e.g. the react-native app):

1. `git subtree split --prefix=packages/records-core -b records-core-split` (or copy the dir).
2. Push to its own repository, `yarn build`, `npm publish`.
3. Replace the alias in consumers with a normal dependency `@citeck/records-core@^x`.
4. Remove the host alias entries (tsconfig paths, vite alias, jest moduleNameMapper) and
   the gantt-submodule compatibility shims (`src/components/Records/Records.ts`,
   `recordsApi.js`) once the submodule migrates.
