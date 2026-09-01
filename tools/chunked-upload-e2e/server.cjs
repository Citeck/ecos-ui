#!/usr/bin/env node
/**
 * A runnable, reproducible browser-level check for the chunked upload client
 * (`src/helpers/chunkedUpload`) against a local stub server implementing the chunked-upload REST
 * contract (`POST/GET/DELETE .../upload-session*`).
 *
 * What this is and isn't:
 *   - It bundles the REAL, unmodified, committed `src/helpers/chunkedUpload/index.js` (via the
 *     `esbuild` binary this repo already vendors as a transitive dependency of vite — no new
 *     package.json dependency added) into a standalone browser script and serves it next to a
 *     small HTML harness (`index.html`) that drives it.
 *   - It is NOT a CI e2e suite and does not run under `yarn jest`/`yarn build`. It needs a real
 *     browser, pointed at the URL this prints, to actually execute — see README.md.
 *   - The project carries no browser-automation dependency (no Playwright/Puppeteer/Cypress) —
 *     see README.md for why this harness is a plain HTML page with clickable buttons instead of
 *     a scripted driver, and how to script it anyway if you have such a tool available locally.
 *
 * Usage: node tools/chunked-upload-e2e/server.cjs [port]   (default 8999 — check it's free first,
 * e.g. `ss -lptn 'sport = :8999'`, in case another worktree is already using it.)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const PORT = process.argv[2] ? Number(process.argv[2]) : 8999;
const CONTENT_BASE = '/gateway/emodel/api/ecos/webapp/content';

const CHUNKING_THRESHOLD = 1 * 1024 * 1024; // 1MB
const MAX_SINGLE_UPLOAD_SIZE = 200 * 1024 * 1024;
const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ESBUILD_BIN = path.join(REPO_ROOT, 'node_modules', '.bin', 'esbuild');
const MODULE_ENTRY = path.join(REPO_ROOT, 'src', 'helpers', 'chunkedUpload', 'index.js');

const sessions = new Map(); // uploadId -> {offset, size, chunkSize, name, mimeType, status, entityRef}
const requestLog = [];
let failNextChunkAtOffset = null; // one-shot: destroy the socket instead of responding
let offlineUntil = 0; // wall-clock ms: every REST request before this is dropped (see /__test/offline-for)

let bundleCache = null;
function buildBundle() {
  if (bundleCache) {
    return bundleCache;
  }
  if (!fs.existsSync(ESBUILD_BIN)) {
    throw new Error(
      `esbuild binary not found at ${ESBUILD_BIN} — run \`yarn install\` in ${REPO_ROOT} first (esbuild is a transitive dependency of vite, already vendored; nothing extra to add).`
    );
  }
  bundleCache = execFileSync(ESBUILD_BIN, [MODULE_ENTRY, '--bundle', '--format=iife', '--global-name=ChunkedUpload'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
  return bundleCache;
}

function log(entry) {
  requestLog.push({ t: Date.now(), ...entry });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function drainAndCountBytes(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    req.on('data', chunk => (total += chunk.length));
    req.on('end', () => resolve(total));
    req.on('error', reject);
  });
}

/**
 * Injects a genuine network-level failure for one request: consume its body (so the connection
 * doesn't just hang), then send response headers declaring a `Content-Length` far larger than
 * what is actually written before severing the socket.
 *
 * Why not simply destroy the socket: a request that has received *zero* response bytes on a
 * reused keep-alive connection is eligible for Chromium's transparent, below-JavaScript retry —
 * `xhr.onerror` never fires and the client's own retry/resync code is never exercised (that bug
 * made an earlier version of scenario 2 pass vacuously; see README.md). A body that ends short of
 * its declared `Content-Length` is not that case: Chromium reports ERR_CONTENT_LENGTH_MISMATCH,
 * which `XMLHttpRequest` surfaces via `onerror`.
 *
 * The caller must NOT have advanced any session state — the point is that, from the server's own
 * state, the request looks exactly like it never landed.
 */
async function killRequest(req, res) {
  await drainAndCountBytes(req);
  res.writeHead(200, { 'Content-Type': 'application/json;charset=UTF-8', 'Content-Length': 1000 });
  // `res.write()` only hands the bytes to Node's internal buffer — destroying the socket
  // synchronously right after can drop them before they ever reach the client, which makes the
  // truncated body indistinguishable from "zero bytes received" and falls back into the
  // transparently-retried case above. Wait for the write callback plus a short flush delay.
  await new Promise(resolve => res.write('{"offse', resolve)); // well short of the declared 1000 bytes
  await new Promise(resolve => setTimeout(resolve, 50));
  req.socket.destroy();
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json;charset=UTF-8' });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // --- static test harness ---
  if (req.method === 'GET' && pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    return;
  }
  if (req.method === 'GET' && pathname === '/bundle.js') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(buildBundle());
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(String((e && e.message) || e));
    }
    return;
  }

  // --- test-driver control endpoints (not part of the real REST contract) ---
  if (req.method === 'GET' && pathname === '/__test/requests') {
    sendJson(res, 200, requestLog);
    return;
  }
  if (req.method === 'POST' && pathname === '/__test/reset') {
    requestLog.length = 0;
    sessions.clear();
    failNextChunkAtOffset = null;
    offlineUntil = 0;
    sendJson(res, 200, { ok: true });
    return;
  }
  if (req.method === 'POST' && pathname === '/__test/fail-next-chunk-at') {
    failNextChunkAtOffset = Number(url.searchParams.get('offset'));
    sendJson(res, 200, { ok: true, failNextChunkAtOffset });
    return;
  }
  // The "devtools offline for N seconds, then continue" switch. Unlike
  // `/__test/fail-next-chunk-at`, which drops one chunk, this drops every request to the REST
  // contract for a whole window — including the status GET the client issues to resynchronise
  // after the failed chunk. That combination is what a real outage looks like.
  // These `/__test/*` control endpoints and the static harness stay reachable throughout (this
  // check sits below them), so the page can still drive and inspect the run while "offline".
  if (req.method === 'POST' && pathname === '/__test/offline-for') {
    const ms = Number(url.searchParams.get('ms')) || 0;
    offlineUntil = Date.now() + ms;
    log({ method: 'POST', path: '/__test/offline-for', ms });
    sendJson(res, 200, { ok: true, ms, offlineUntil });
    return;
  }

  // --- real REST contract, under CONTENT_BASE ---
  if (!pathname.startsWith(CONTENT_BASE)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const rest = pathname.slice(CONTENT_BASE.length);

  if (Date.now() < offlineUntil) {
    // Deliberately BEFORE any session bookkeeping: nothing about this request is allowed to
    // change server state, exactly as if it had never reached the server at all.
    log({ method: req.method, path: rest, result: 'DROPPED_OFFLINE', offlineMsLeft: offlineUntil - Date.now() });
    await killRequest(req, res);
    return;
  }

  if (req.method === 'GET' && rest === '/upload-config') {
    log({ method: 'GET', path: rest });
    sendJson(res, 200, { chunkingThreshold: CHUNKING_THRESHOLD, maxSingleUploadSize: MAX_SINGLE_UPLOAD_SIZE });
    return;
  }

  if (req.method === 'POST' && rest === '/upload-session') {
    const body = await readJsonBody(req);
    const uploadId = crypto.randomUUID();
    sessions.set(uploadId, {
      offset: 0,
      size: body.size,
      chunkSize: CHUNK_SIZE,
      name: body.name,
      mimeType: body.mimeType,
      status: 'ACTIVE',
      entityRef: null
    });
    log({ method: 'POST', path: rest, body, uploadId });
    sendJson(res, 200, { supported: true, uploadId, chunkSize: CHUNK_SIZE });
    return;
  }

  const chunkMatch = rest.match(/^\/upload-session\/([^/]+)\/chunk$/);
  if (req.method === 'POST' && chunkMatch) {
    const uploadId = chunkMatch[1];
    const offset = Number(url.searchParams.get('offset'));
    const session = sessions.get(uploadId);

    if (!session) {
      log({ method: 'POST', path: rest, offset, result: 404 });
      req.resume();
      res.writeHead(404);
      res.end();
      return;
    }

    if (failNextChunkAtOffset !== null && offset === failNextChunkAtOffset) {
      failNextChunkAtOffset = null;
      // Simulate a mid-upload network interruption that a real browser cannot transparently
      // retry below JS — see `killRequest` for exactly how, and why the obvious
      // "just destroy the socket" version was a vacuous no-op. `session.offset` is deliberately
      // left untouched: this attempt must look, from the server's own state, like it never
      // landed.
      log({ method: 'POST', path: rest, offset, result: 'SIMULATED_TRUNCATED_RESPONSE' });
      await killRequest(req, res);
      return;
    }

    if (offset !== session.offset) {
      await drainAndCountBytes(req);
      log({ method: 'POST', path: rest, offset, result: 409, confirmedOffset: session.offset });
      sendJson(res, 409, { offset: session.offset });
      return;
    }

    const receivedBytes = await drainAndCountBytes(req);
    session.offset = Math.min(session.offset + receivedBytes, session.size);
    log({ method: 'POST', path: rest, offset, receivedBytes, newOffset: session.offset });
    sendJson(res, 200, { offset: session.offset });
    return;
  }

  const completeMatch = rest.match(/^\/upload-session\/([^/]+)\/complete$/);
  if (req.method === 'POST' && completeMatch) {
    const uploadId = completeMatch[1];
    const session = sessions.get(uploadId);

    if (!session) {
      log({ method: 'POST', path: rest, result: 404 });
      res.writeHead(404);
      res.end();
      return;
    }
    if (session.offset < session.size) {
      log({ method: 'POST', path: rest, result: 409, offset: session.offset, size: session.size });
      sendJson(res, 409, { offset: session.offset, size: session.size });
      return;
    }
    session.status = 'DONE';
    session.entityRef = `emodel/temp-file@stub-${uploadId}`;
    log({ method: 'POST', path: rest, result: 200, entityRef: session.entityRef });
    sendJson(res, 200, { entityRef: session.entityRef });
    return;
  }

  const statusMatch = rest.match(/^\/upload-session\/([^/]+)$/);
  if (req.method === 'GET' && statusMatch) {
    const uploadId = statusMatch[1];
    const session = sessions.get(uploadId);

    if (!session) {
      log({ method: 'GET', path: rest, result: 404 });
      res.writeHead(404);
      res.end();
      return;
    }
    log({ method: 'GET', path: rest, result: 200, offset: session.offset });
    sendJson(res, 200, {
      status: session.status,
      offset: session.offset,
      size: session.size,
      chunkSize: session.chunkSize,
      name: session.name,
      mimeType: session.mimeType,
      ...(session.entityRef ? { entityRef: session.entityRef } : {})
    });
    return;
  }

  if (req.method === 'DELETE' && statusMatch) {
    const uploadId = statusMatch[1];
    const session = sessions.get(uploadId);

    if (!session) {
      log({ method: 'DELETE', path: rest, result: 404 });
      res.writeHead(404);
      res.end();
      return;
    }
    session.status = 'CANCELLED';
    log({ method: 'DELETE', path: rest, result: 204 });
    res.writeHead(204);
    res.end();
    return;
  }

  log({ method: req.method, path: rest, result: 'UNHANDLED' });
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Chunked-upload e2e harness listening on http://localhost:${PORT}/`);
  console.log('Open that URL in a real browser and click the scenario buttons (see README.md).');
});
