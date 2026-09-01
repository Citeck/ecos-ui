/**
 * @jest-environment node
 *
 * `worker.js` is a dedicated Web Worker bundle (built by Vite via the `?worker` import in
 * `src/workers/docLib/index.js`) — `window`/`document` do not exist there.
 * `src/helpers/chunkedUpload`, which `worker.js` imports `uploadContent` from, is DOM-free for
 * that reason: `getCurrentLocale()`/`getCookie()`, reached through `transport.js`, both guard on
 * `typeof window`/`typeof document` and fall back to a default locale instead of throwing.
 *
 * This is the one place that actually exercises the "no window/document" branch: every other
 * jest test in this repo runs under `jest-environment-jsdom`, where `self === window === global`
 * — `typeof window` is never `'undefined'` there, so the guard's true branch is never hit. A real
 * Node environment (no jsdom) is the only way inside jest to prove the fallback actually fires
 * instead of throwing.
 *
 * `src/setupTests.ts`'s `window.ResizeObserver` polyfill line is guarded on `typeof window` (see
 * that file) precisely so this global `setupFilesAfterEnv` file — applied to every test
 * regardless of `@jest-environment` — doesn't crash a node-environment test like this one.
 */
test('typeof window/document really are undefined in this environment', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
});

test('chunkedUpload module imports and its locale helper degrades gracefully with no window/document', () => {
  const { uploadContent, getUploadConfig, UploadError, FileStatuses } = require('@/helpers/chunkedUpload');
  const { getCurrentLocale } = require('@/helpers/export/util');

  expect(typeof uploadContent).toBe('function');
  expect(typeof getUploadConfig).toBe('function');
  expect(typeof UploadError).toBe('function');
  expect(FileStatuses.DONE).toBe('done');

  // Real worker path: getCookie's `typeof document !== 'undefined'` guard is false, so
  // getCurrentLocale falls through to its own `typeof window === 'undefined'` guard and returns
  // the default locale — never throws.
  expect(getCurrentLocale()).toBe('en');
});
