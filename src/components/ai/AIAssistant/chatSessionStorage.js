/**
 * Persistence of the universal chat session across page reloads (defect D-B-14).
 *
 * Stores the pair `conversationId` + active `requestId` so that a request started before a reload
 * can be picked up again instead of being silently lost. `sessionStorage` (not `localStorage`) is
 * used on purpose: a record in `localStorage` is one shared cell, so two open tabs would overwrite
 * each other's conversation and a stale `requestId` would survive until the next visit.
 *
 * What `sessionStorage` gives is per-*browsing-context* scope, which is not quite per-tab: a tab
 * created from this one — "Duplicate tab", a middle click, `window.open` — starts with a **copy** of
 * the record, so both copies may resume the same `requestId` once each. That is a bounded, cosmetic
 * overlap (the answer is fetched twice and shown in both tabs) and it costs a tab the browser opens
 * independently nothing, which is the case the choice above is about. Do not restate this as "the
 * record is never shared between tabs".
 *
 * Next to the pair the record holds the agent the conversation is bound to. The binding is made
 * server-side and outlives the page just like the conversation does — `AgentOrchestratorService`
 * (citeck-ai) stores the `agentRef` of the first question on the conversation and reuses it for
 * every later question that does not send one. A reload that restored the conversation but not the
 * agent therefore left the chip claiming "Citeck AI" while a specialised agent went on answering.
 *
 * The record additionally carries a timestamp and the owner it was written for, and is dropped once
 * either stops matching what the backend can still serve (see `readRecord`).
 */

import { CHAT_REQUEST_RESUME_TTL_MS, CHAT_SESSION_TTL_MS } from './constants';

import { getCurrentUserName } from '@/helpers/util';

export const CHAT_SESSION_STORAGE_KEY = 'aiAssistantChatSession';

const isNonEmptyString = value => typeof value === 'string' && value.length > 0;

// Both identifiers are interpolated straight into a request path (`…/status/<requestId>`,
// `…/conversation/<conversationId>`), and this record is the one place where they arrive from
// outside the hook's own `generateUUID`. A value carrying `/`, `?`, `#` or `%` would retarget that
// path — `../../conversation/<someone-else's-id>` behind the "clear chat" button — so anything that
// is not a plain identifier is refused here rather than sent. Length is capped for the same reason.
const ID_PATTERN = /^[\w.:@-]{1,128}$/;

const isUsableId = value => isNonEmptyString(value) && ID_PATTERN.test(value);

// A stored name is only ever rendered, but it comes back from a storage anything running on this
// origin can write, so it is capped rather than trusted to be a label.
const AGENT_NAME_MAX_LENGTH = 200;

/**
 * Reduces a selected agent to what has to survive a reload, or refuses it.
 *
 * Only the three fields the interface reads back are kept: `id` — the next question's `agentRef`
 * (`buildAgentRef`) and the marker of the selected row in the dropdown, `name` — the chip label,
 * `engine` — its icon. The dropdown reloads the full list from the backend when it is opened, so
 * storing anything else would only be a second, staler copy of it. `id` is held to the same pattern
 * as the two identifiers: it is interpolated into a record reference that is sent to the backend.
 * @param {*} agent - Value to sanitize
 * @returns {?{ id: string, name?: string, engine?: string }} Storable agent or null
 */
const sanitizeAgent = agent => {
  if (!agent || typeof agent !== 'object' || Array.isArray(agent) || !isUsableId(agent.id)) {
    return null;
  }

  const stored = { id: agent.id };
  if (isNonEmptyString(agent.name)) {
    stored.name = agent.name.slice(0, AGENT_NAME_MAX_LENGTH);
  }
  if (isNonEmptyString(agent.engine)) {
    stored.engine = agent.engine;
  }

  return stored;
};

/**
 * Checks that a parsed record has the expected shape
 * @param {*} record - Parsed value from the storage
 * @returns {boolean} True when the record can be used
 */
const hasValidShape = record => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return false;
  }

  return isUsableId(record.conversationId) && Number.isFinite(record.savedAt);
};

const isExpired = savedAt => Date.now() - savedAt > CHAT_SESSION_TTL_MS;

/**
 * Whether the stored request may still be answered by the backend
 * @param {number} savedAt - When the record carrying the request was written
 * @returns {boolean} True while the request is still worth polling
 */
const isRequestResumable = savedAt => Date.now() - savedAt <= CHAT_REQUEST_RESUME_TTL_MS;

/**
 * Whether the record was written for the user who is logged in now.
 *
 * `sessionStorage` outlives a logout in the same tab, so without this check the next user to log in
 * would inherit the previous one's `conversationId` — and `ConversationOwnerGuard` in citeck-ai
 * answers 404 to everybody but the owner, including the DELETE behind the "clear chat" button. The
 * chat would then be wedged with no way out from the interface.
 *
 * An unknown user on either side is not treated as a mismatch: `Citeck.constants.USERNAME` is not
 * populated in every context, and dropping the record there would lose a live conversation for no
 * reason. The backend guard makes the very same call — a blank user is let through.
 * @param {{ owner: ?string }} record - Parsed record from the storage
 * @returns {boolean} True when the record may be used by the current user
 */
const belongsToCurrentUser = record => {
  const currentUser = getCurrentUserName();
  return !currentUser || !record.owner || record.owner === currentUser;
};

/**
 * Removes the stored session record entirely
 * @returns {void}
 */
export const clearSession = () => {
  try {
    sessionStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear the AI assistant chat session:', e);
  }
};

/**
 * Reads and validates the stored record without touching the storage on success
 * @returns {?{ conversationId: string, requestId: ?string, agent: ?Object, owner: ?string, savedAt: number }}
 *   Valid record or null
 */
const readRecord = () => {
  let raw;

  // Kept apart from the parsing below on purpose: a storage that refuses to be read holds nothing
  // that could be dropped, and calling `clearSession` on it would only log a second failure.
  try {
    raw = sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to read the AI assistant chat session:', e);
    return null;
  }

  if (!raw) {
    return null;
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse the AI assistant chat session:', e);
    // Unparseable is the same verdict as malformed below and gets the same treatment — the
    // docstring of `loadSession` names corrupted JSON among the cases the record is dropped for.
    // Left in place it would survive every read for the life of the tab: a `console.error` on each
    // one, and `clearActiveRequestId` silently doing nothing, because it reads before it writes.
    // Only a `saveSession` would overwrite it, that is only if the user asks something.
    clearSession();
    return null;
  }

  if (!hasValidShape(parsed) || isExpired(parsed.savedAt) || !belongsToCurrentUser(parsed)) {
    // A malformed, outdated or foreign record is of no use to anybody — drop it right away
    clearSession();
    return null;
  }

  return parsed;
};

/**
 * Loads the persisted chat session
 * @returns {?{ conversationId: string, requestId: ?string, requestCompleted: boolean, agent: ?Object }}
 *   Session or null when there is nothing usable in the storage (no record, wrong shape, corrupted
 *   JSON, expired, foreign owner, storage unavailable). The `requestId` is reported only while the
 *   backend can still answer it; the conversation and the agent it is bound to outlive it by far and
 *   are returned either way. `requestCompleted` says which of the two things that id is for — a
 *   request still running, to be picked up and polled, or a finished one whose result is to be
 *   fetched once and laid out.
 */
export const loadSession = () => {
  const record = readRecord();
  if (!record) {
    return null;
  }

  const requestId = isUsableId(record.requestId) && isRequestResumable(record.savedAt) ? record.requestId : null;

  return {
    conversationId: record.conversationId,
    requestId,
    requestCompleted: !!requestId && !!record.requestCompleted,
    agent: sanitizeAgent(record.agent)
  };
};

/**
 * Writes the record, stamping it with the given owner
 * @param {string} conversationId - Server-side conversation identifier
 * @param {?string} requestId - Identifier of the request being polled, null when none is active
 * @param {?string} owner - User the record belongs to
 * @param {?Object} agent - Agent the conversation is bound to, null for the default assistant
 * @returns {void}
 */
const writeRecord = (conversationId, requestId, owner, agent, requestCompleted = false) => {
  // Refusing the id is right — it is interpolated into a request path — but doing it silently is
  // not: the whole request resume goes with it, and the chat still tells the user to close and
  // reopen the panel to collect an answer that can no longer be collected. Nothing else in that
  // chain says a word, so a backend id in an unexpected shape would be undiagnosable from the
  // browser. Only the shape is reported, never the value.
  if (requestId != null && !isUsableId(requestId)) {
    console.warn('AI assistant: the request id was refused by the storage, the request cannot be resumed after a reload');
  }
  try {
    sessionStorage.setItem(
      CHAT_SESSION_STORAGE_KEY,
      JSON.stringify({
        conversationId,
        requestId: isUsableId(requestId) ? requestId : null,
        // Whether that request is over. A finished request is worth keeping — the backend holds its
        // result for an hour and hands it back by the same id — but it must not be polled again on
        // the next page: it is fetched once and laid out (D-B-14, case B12).
        requestCompleted: !!requestCompleted && isUsableId(requestId),
        agent: sanitizeAgent(agent),
        owner: owner || null,
        savedAt: Date.now()
      })
    );
  } catch (e) {
    console.error('Failed to save the AI assistant chat session:', e);
  }
};

/**
 * Saves the conversation, the currently active request and the agent the conversation is bound to
 * @param {string} conversationId - Server-side conversation identifier
 * @param {?string} [requestId] - Identifier of the request being polled, null when none is active
 * @param {?Object} [agent] - Selected agent, null for the default assistant. Passed on every save
 *   rather than kept from the previous record: the caller holds the selection, and a record that
 *   silently kept an older one would put a name on the chip the conversation is not bound to.
 * @returns {void}
 */
export const saveSession = (conversationId, requestId = null, agent = null) => {
  // The same check the reader applies, so a record that could never be read back is not written in
  // the first place — otherwise the persistence would look healthy and resume nothing.
  if (!isUsableId(conversationId)) {
    return;
  }

  writeRecord(conversationId, requestId, getCurrentUserName(), agent);
};

/**
 * Drops the active request, keeping the conversation — called once a request is finished, cancelled
 * or lost, so that the next question continues the same server-side conversation.
 *
 * The owner already on the record is carried over rather than re-read from the current user: a
 * request may well finish at a moment when `Citeck.constants.USERNAME` is not populated (the very
 * possibility `belongsToCurrentUser` allows for), and re-stamping the record with a blank owner
 * would erase the guard — the next user to log in in this tab would then inherit the conversation,
 * which is exactly what the field exists to prevent. The agent is carried over for the plain reason
 * that finishing a request changes nothing about which agent the conversation is bound to.
 * @returns {void}
 */
export const clearActiveRequestId = () => {
  const record = readRecord();
  if (!record) {
    return;
  }

  writeRecord(record.conversationId, null, record.owner, record.agent);
};

/**
 * Keeps the request on the record but marks it finished — called when a turn has produced its
 * answer, instead of forgetting the request outright.
 *
 * A finished turn may leave the dialog waiting on the user: a deploy confirmation, an escalation,
 * any HITL gate the backend holds as `PENDING_DEPLOY` until it is answered. Dropping the id then
 * made the gate unreachable after a reload — the server went on waiting while the interface showed
 * an empty chat with nothing to answer with (D-B-14, case B12). The id is what brings the card back:
 * `UniversalAssistantController` keeps a finished result for an hour and returns it by the same id,
 * so restoring costs one request and no polling.
 *
 * The timestamp is deliberately refreshed by the write: the hour the backend keeps the result runs
 * from the moment the turn finished, not from when it was started.
 *
 * Owner and agent are carried over for the same reasons as in `clearActiveRequestId`.
 * @returns {void}
 */
export const markRequestCompleted = () => {
  const record = readRecord();
  if (!record || !isUsableId(record.requestId)) {
    return;
  }

  writeRecord(record.conversationId, record.requestId, record.owner, record.agent, true);
};
