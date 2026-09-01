# Chunked upload browser harness

A small, reproducible browser-level check for `src/helpers/chunkedUpload` — the client module
behind every upload transport in this app (`uploadFileV2`, the formio `url` storage provider, the
doc-lib worker, versioned upload). It is **not** part of `yarn jest`/`yarn build` and does not run
in CI; it exists so a human (or a script, if you have a browser-automation tool available) can
watch the real, unmodified, committed module talk to a server implementing the chunked-upload REST
contract, in a real browser, and see for itself that chunking, interruption/resume, cancellation
and recovery from a full network outage work.

## Why a plain HTML page instead of a scripted Playwright/Cypress test

This project does not carry a browser-automation dependency (no `playwright`, `puppeteer`, or
`cypress` in `package.json`), and this harness does not add one. Instead:

- `server.cjs` is plain Node `http`, zero new dependencies.
- It bundles the real `src/helpers/chunkedUpload/index.js` via the `esbuild` binary this repo
  already vendors (a transitive dependency of `vite`, resolved from `node_modules/.bin/esbuild` —
  nothing added to `package.json`).
- `index.html` has actual clickable buttons and an on-page PASS/FAIL panel, so it's directly
  runnable by a human with nothing but a browser. If you _do_ have Playwright (or any other
  browser-automation tool) available on your machine, you can drive the same page with it —
  the page also exposes `window.runScenario('chunking'|'interruption'|'cancel'|'offline')` /
  `window.runAll()` and populates `window.__allResults` for exactly that purpose.

## How to run

1. Check the port is free (default 8999; pass a different one as the first argument if not):
   ```
   ss -lptn 'sport = :8999'
   ```
2. From the repo root:
   ```
   node tools/chunked-upload-e2e/server.cjs 8999
   ```
3. Open `http://localhost:8999/` in a real browser.
4. Click "Run all 4", or each scenario button individually. Each turns green (PASS) or red (FAIL)
   with a one-line summary; the log panel below shows every `handleProgress` event as it happens.
5. `Ctrl-C` the server when done. It only listens on localhost and never touches Docker.

For raw evidence beyond the on-page summary, `GET http://localhost:8999/__test/requests` returns
the full JSON log of every request the stub received (method, path, offset, result) — useful for
confirming e.g. exactly which offsets were retried.

## What each scenario proves

1. **Multi-chunk upload** (`scenarioChunking`): a 3.5MB synthetic file against a 1MB
   `chunkingThreshold`/`chunkSize` stub. Asserts: exactly 4 `POST .../chunk` requests were made
   (1MB, 1MB, 1MB, 0.5MB), the module reached the `done` progress status, and `complete` returned
   an `entityRef`.
2. **Mid-upload network interruption → automatic resume from the server-confirmed offset**
   (`scenarioInterruption`): a 4MB file; the stub is told (via `/__test/fail-next-chunk-at`) to
   fail the chunk starting at offset 1MB exactly once — see "How the interruption is injected"
   below for why this is a genuine network-level failure, not something Chromium can silently
   retry underneath the module. The assertion is deliberately strict, not just "it finished
   eventually": from the stub's own request log it checks, **in order**, that the failed chunk is
   followed by a `GET /upload-session/{id}` (`session.js`'s `fetchConfirmedOffset`) which is in
   turn followed by a chunk retry **at exactly the offset that `GET` reported**, plus that all 4
   chunks eventually succeeded and `complete` returned an `entityRef`. Without the ordering+offset
   check, "the upload eventually finished" is not evidence of anything — see the note below on why
   an earlier version of this harness passed this scenario without exercising any of that code.
3. **Cancellation issues `DELETE`** (`scenarioCancel`): a 5MB file; the harness captures the
   control facade handed to `handleProgress` and calls `.abort()` right after observing the first
   chunk's progress. Asserts: `uploadContent`'s promise rejected with `{aborted: true}`, and the
   stub received a `DELETE /upload-session/{id}`.
4. **The network is down for 10 s, then comes back** (`scenarioOffline`): a 4MB file; once bytes
   are actually moving the harness flips the stub into "offline" mode (`/__test/offline-for?ms=10000`),
   which drops **every** request to the REST contract for that whole window — chunk POSTs *and*
   the status GET the client issues to resynchronise after them. Scenario 2's one-shot chunk drop
   cannot express that, and it is the exact condition the client used to fail: with the resync GET
   outside the retry loop's try/catch, ONE dropped GET — about one second into the outage — killed
   the upload (`preparing, getting_upload_params, uploading, restarted, error_upload`; rejected
   with "network error"). Asserts, from the stub's own request log: at least one chunk POST **and**
   at least one status GET were dropped during the outage, a status GET succeeded after the last
   drop, all 4 chunks were eventually confirmed, and `complete` returned an `entityRef`.

## How the interruption is injected, and why it can't be silently retried

An earlier version of this harness injected the failure by destroying the TCP socket before
writing anything at all. That turned out to be **exactly** the case Chromium's network stack
knows how to paper over on its own: a request that has received zero response bytes on a reused
keep-alive connection is eligible for a transparent, below-JavaScript retry. `xhr.onerror` never
fired, `session.js`'s own backoff/resync code was never reached, and the scenario still reported
PASS — a vacuous pass that proved nothing.

The fix (`server.cjs`'s `/chunk` handler, the `SIMULATED_TRUNCATED_RESPONSE` branch): consume the
chunk's bytes so the connection doesn't hang, deliberately leave the session's server-side offset
unchanged, then send response headers declaring `Content-Length: 1000` but only actually write ~8
bytes before destroying the socket. A response body that ends short of its declared
`Content-Length` is not a "zero bytes received" case, so it is never eligible for the transparent
retry above — Chromium reports `net::ERR_CONTENT_LENGTH_MISMATCH`, a genuine network-level
failure, and `XMLHttpRequest` surfaces it via `onerror`, not `load`.

Measured with a Playwright page instrumented with `request`/`response`/`requestfailed`/
`requestfinished` listeners: the injected chunk produces a `requestfailed` event with
`failure.errorText === 'net::ERR_CONTENT_LENGTH_MISMATCH'`, and the retry request lands ~1005ms
later, matching `session.js`'s `BACKOFF_INITIAL_MS = 1000`, with a genuine
`GET /upload-session/{id}` request in between. The on-page log for this scenario also shows a
`restarted` progress event (`FileStatuses.RESTARTED`, emitted by `session.js` immediately before
`fetchConfirmedOffset`), which only ever fires on this real retry path.

## Stub server endpoints

Implements the chunked-upload REST contract under `/gateway/emodel/api/ecos/webapp/content`:
`GET upload-config`, `POST upload-session`, `POST upload-session/{id}/chunk?offset=N`,
`GET upload-session/{id}`, `POST upload-session/{id}/complete`, `DELETE upload-session/{id}`.
Plus test-only control endpoints (not part of the real contract, only used by this harness):
`POST /__test/reset`, `POST /__test/fail-next-chunk-at?offset=N`,
`POST /__test/offline-for?ms=N`, `GET /__test/requests`. The `/__test/*` endpoints and the static
harness itself stay reachable while "offline" — only requests under the content base are dropped —
so the page can still drive and inspect a run in progress.

Both failure injections (`fail-next-chunk-at` and `offline-for`) go through the same
`killRequest()` helper, i.e. the truncated-response trick described above; neither ever advances
the session's server-side offset.
