/**
 * Utility functions for AIAssistant components
 */

import { ADDITIONAL_CONTEXT_TYPES, FILE_SAVE_ACTION } from './constants';

import { t } from '@/helpers/export/util';

/**
 * Generates a UUID v4 string
 * @returns {string} UUID string
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Determines the status of a stage based on current progress
 * @param {string} stageName - Name of the stage
 * @param {number} currentProgress - Current progress value (0-100)
 * @param {Object} progressRange - Object with min and max progress values for this stage
 * @returns {'pending'|'completed'|'active'} Stage status
 */
export const getStageStatus = (stageName, currentProgress, progressRange) => {
  if (!progressRange) return 'pending';

  const { min, max } = progressRange;

  if (currentProgress < min) return 'pending';
  if (currentProgress > max) return 'completed';
  return 'active';
};

/**
 * Formats timestamp to HH:MM format
 * @param {Date} timestamp - Date object
 * @returns {string} Formatted time string
 */
export const formatMessageTime = timestamp => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Truncates text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/** Separator the page address puts between a record reference and its routing alias. */
const RECORD_REF_ALIAS_SEPARATOR = '-alias-';

/**
 * A record reference as read from the page address, with its `-alias-<alias>` suffix cut off.
 *
 * A card may be opened as `...?recordRef=<ref>-alias-<alias>` (`Records.ts` mints the alias for a
 * record created in the browser). The suffix is a routing detail of that address and not part of the
 * record's identity: sent to the backend it resolves no record, and left on one side of a comparison
 * it makes the two spellings of one record look like two — `isSameRecordRef` reconciles only the
 * application prefix, never this. So the current record is offered by the `@` dropdown although its
 * chip is already on screen, and is sent twice in one request (D-B-18).
 *
 * The rule holds at every point where a reference is read from the URL, which is why it lives here
 * rather than being spelled out at each of them. A reference that is nothing but an alias suffix
 * leaves nothing behind and is reported as absent. The cut is made at the first separator, so a
 * local id carrying one of its own would lose the rest — the shape has never been supported, and
 * every copy of this rule that preceded the helper behaved the same way.
 * @param {*} recordRef - Reference as read from the address, or anything else
 * @returns {?string} The reference without its alias suffix, or null when nothing usable is left
 */
export const stripRecordRefAlias = recordRef => {
  if (typeof recordRef !== 'string' || !recordRef) {
    return null;
  }
  return recordRef.split(RECORD_REF_ALIAS_SEPARATOR)[0] || null;
};

/**
 * The record reference a form component may hand to the AI services.
 *
 * `options.recordId` alone will not do: a card opened for editing carries a browser-side alias
 * (`Records.getRecordToEdit` mints `<id>-alias-<n>`), which the backend resolves to nothing — it
 * then answers about an empty field and the model invents its content (D-G-ALIASREF, case G9).
 *
 * `baseRecordId` is what `EcosForm` publishes next to it, taken from the record itself
 * (`getBaseRecord().id`) rather than from its string form: the shape of the alias belongs to
 * `records-core` and had already been open-coded in seven places. The string cut stays as the net
 * for a form host that publishes no base id, so that its absence degrades to a cut reference rather
 * than to a broken request.
 * @param {?{baseRecordId?: string, recordId?: string}} options - Form options
 * @returns {string} Reference safe to send, or an empty string when there is none
 */
export const resolveAiRecordRef = options => {
  return options?.baseRecordId || stripRecordRefAlias(options?.recordId) || '';
};

/**
 * Whether two record references point at the same record.
 *
 * Full string equality is checked first; when it fails, and only when exactly one of the two names
 * its application, the prefixed one is compared without that prefix. The fallback is what the autocomplete
 * list needs: the current record arrives as the `recordRef` query parameter of the page address
 * (`helpers/urls.js:getRecordRef`) while search results carry `record.id` as the server returned it
 * (`AdditionalContextService.searchRecordsByDisp`), and neither side is normalised — so the very
 * same record may be written `emodel/type@id` on one side and `type@id` on the other.
 *
 * Only the application prefix is dropped, never a `/` that belongs to the reference itself: in
 * `alfresco/@workspace://SpacesStore/id` the local id carries slashes of its own, and cutting at the
 * last one would leave a bare `id` that matches any other record with the same id in another store.
 *
 * Anything that is not a non-empty string gives `false`: unknown is never treated as equal. No
 * exceptions are thrown.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export const isSameRecordRef = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  // The application prefix is the first `/`, and only when it comes before the `@` that opens the
  // local id: `alfresco/@workspace://SpacesStore/id` then keeps everything from its `@` onwards. A
  // reference with no `@` is not in `app/sourceId@localId` form at all, so it is compared whole.
  const hasAppPrefix = ref => {
    const at = ref.indexOf('@');
    const slash = ref.indexOf('/');
    return at !== -1 && slash !== -1 && slash < at;
  };
  // Only the side that carries a prefix may lose it. Stripped from both, `emodel/contract@1a2b` and
  // `alfresco/contract@1a2b` — two records of two different applications — reduced to the same
  // string and compared equal, and every caller of this helper turns that into a silent drop: the
  // record vanishes from the `@` autocomplete list, is refused entry to the context, or is filtered
  // out of the auto-context chips, with nothing said anywhere. Two references that both name their
  // application and name different ones are simply different records, and `a === b` above has
  // already settled the case where they name the same one.
  if (hasAppPrefix(a) === hasAppPrefix(b)) {
    return false;
  }
  // The prefixed side keeps everything from its `@` onwards, and the bare one is (already non-empty)
  // whole, so neither part can be empty here.
  const localPart = ref => (hasAppPrefix(ref) ? ref.slice(ref.indexOf('/') + 1) : ref);
  return localPart(a) === localPart(b);
};

/**
 * Whether toggling [item] will take it OUT of the manual context rather than put it in.
 *
 * The context chips and the `@` list share one toggle, and the two directions are not symmetrical.
 * A record may be held twice over — picked by hand and attached by the backend as an auto-context
 * artifact — and the artifact is hidden while the manual entry is there
 * (`visibleAutoContextArtifacts`). Removing must therefore take both away, or the hidden artifact
 * reappears as an identical chip and the record can never be got out of the context; adding must
 * leave the artifact alone, so that walking off the record's page brings it back.
 *
 * Only the two collections that can hold a record reference are consulted: attributes carry no
 * reference and no artifact can shadow them.
 * @param {string} contextType - One of ADDITIONAL_CONTEXT_TYPES
 * @param {?{recordRef?: string}} item - The entry the toggle was called with
 * @param {?{records?: Array, documents?: Array}} additionalContext - Manual context as it is now
 * @returns {boolean} True when the toggle removes the entry
 */
export const isContextRemoval = (contextType, item, additionalContext) => {
  const collection =
    contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD
      ? additionalContext?.records
      : contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS
        ? additionalContext?.documents
        : null;
  if (!item?.recordRef || !collection?.length) {
    return false;
  }
  return collection.some(entry => isSameRecordRef(entry?.recordRef, item.recordRef));
};

/**
 * If [actionId] is a pending-file save/cancel action (`<base>|<tempRef>`), returns its tempRef;
 * otherwise null. The tempRef lets us locate and clean up the now-dead preview once the temp
 * file backing it is deleted on save/cancel (COREDEV-321), and it is what makes a file-save
 * action resource-scoped rather than dialog-scoped (see `isGateStale`).
 * @param {string} actionId
 * @returns {string|null}
 */
export const fileSaveActionTempRef = actionId => {
  if (typeof actionId !== 'string') {
    return null;
  }
  const sepIndex = actionId.indexOf(FILE_SAVE_ACTION.TEMP_REF_SEPARATOR);
  if (sepIndex < 0) {
    return null;
  }
  const baseAction = actionId.slice(0, sepIndex);
  const tempRef = actionId.slice(sepIndex + 1);
  if (!tempRef) {
    return null;
  }
  const isFileSaveAction =
    baseAction === FILE_SAVE_ACTION.MAIN_CONTENT ||
    baseAction === FILE_SAVE_ACTION.NEW_RECORD ||
    baseAction === FILE_SAVE_ACTION.CANCEL ||
    baseAction.startsWith(FILE_SAVE_ACTION.ATTR_PREFIX);
  return isFileSaveAction ? tempRef : null;
};

/**
 * True when every action of the set is a file-save action (`<base>|<tempRef>`).
 * Such a set is tied to one proposed file rather than to a step of the dialog: several files
 * may await a decision at the same time, and each waits until its own tempRef is resolved.
 * A mixed set (file-save action next to a regular one) does not qualify — it belongs to a
 * dialog gate and follows the usual staleness rule.
 * @param {Array<{id?: string}>} actions
 * @returns {boolean}
 */
export const isFileSaveActionSet = actions => {
  if (!Array.isArray(actions) || !actions.length) {
    return false;
  }
  return actions.every(action => !!fileSaveActionTempRef(action && action.id));
};

/**
 * Whether a message newer than [index] has actually advanced the dialog.
 *
 * A failed request appends nothing but a client-side error notice (`isError`): it reports that
 * the POST never reached the backend instead of moving the conversation on, so the gate in front
 * of it must stay live and the action must stay retriable. A request the user aborted
 * (`isCancelled`, written over the processing message by `cancelRequest` /
 * `handlePollingCancelled`) says the same thing for the same reason — the turn was called off, not
 * completed — so it does not supersede either. Every remaining way of advancing the dialog (user
 * reply, progress card, server answer) appends or converts an ordinary message, and those do
 * supersede the gates left behind.
 *
 * A free-text reply whose request never went through is the third exception, by the same rule.
 * `handleSubmit` appends the user message before the POST, so on failure the history keeps a
 * message for a turn that did not happen; `handleSubmit` stamps it `isFailedSend` in its `catch`
 * and it is skipped here. Without that, the error notice next to it would be exempt while the
 * message it explains would not — the gate the user was answering would go dead for good, which is
 * exactly what the `isError` exemption exists to prevent for a failed action click.
 *
 * The exemptions stop where the backend may already have acted. Once the POST is accepted the turn
 * counts as happened, whatever becomes of it afterwards: `handleSubmit` writes `isFailedSend` only
 * while the request is still unaccepted, and neither a cancellation nor a polling failure clears
 * the user message that carries the reply — so an aborted or failed free-text turn still retires
 * the gate it was answering, and a second answer to a turn that may be running server-side cannot
 * be sent. Note that positions alone do not enforce this: the processing card of such a turn is
 * rewritten in place as `isCancelled` (`cancelRequest` / `handlePollingCancelled`) or as `isError`
 * (`handlePollingError`) and is therefore exempt here; what closes the gate is the user message
 * ahead of it for a free-text turn, and the `actionsResolved` flag — written on the click and never
 * cleared — for an action click. The `isCancelled` exemption still earns its place: a cancelled
 * *file-save* click appends no user message and sets no flag on the gate, so without it the
 * cancellation notice would retire a gate that was never answered.
 *
 * The answer to a file-save action (`isFileActionNotice`) is the second exception, for the same
 * reason: `handlePendingFileSaveAction` short-circuits before the request is routed to the agent,
 * so it saves or cancels one file and leaves the dialog exactly where it was. Without the
 * exception the Save/Cancel pair the backend merges onto a real gate of the same turn
 * (`enrichWithPendingFile`: `[CONFIRM, REJECT, new_record|<ref>, file_cancel|<ref>]`) would be a
 * trap — saving the file appends this notice, the gate is no longer last, and the `CONFIRM` the
 * backend is still waiting for is rendered disabled with no button left to answer it.
 * @param {Array<{isError?: boolean, isCancelled?: boolean, isFailedSend?: boolean, isFileActionNotice?: boolean}>} messages
 * @param {number} index
 * @returns {boolean}
 */
const isSupersededByNewerMessage = (messages, index) => {
  for (let i = index + 1; i < messages.length; i++) {
    const message = messages[i];
    if (!message || (!message.isError && !message.isCancelled && !message.isFailedSend && !message.isFileActionNotice)) {
      return true;
    }
  }
  return false;
};

/**
 * Whether the gate carried by the message at [index] is no longer live — its action buttons must
 * be rendered disabled and the hint that tells the user what it waits for must be hidden.
 *
 * A gate becomes stale once the dialog has moved past it: any newer message (user reply, progress
 * card, server answer) supersedes it. The rule is derived from the position of the message instead
 * of being written into state, so every way of advancing the dialog disables past gates, including
 * ways added later. Liveness is judged for the message as a whole rather than for its action list:
 * a gate may arrive without buttons at all (a terminal `FAILED` card, an "unsupported action"
 * answer that keeps `agentStatus`), and its hint has to go stale exactly like buttons would.
 *
 * A set made entirely of file-save actions is the exception: those are resource-scoped, not
 * dialog-scoped. Several files may await a decision at once, each valid until its own tempRef
 * resolves, so such a message stays live wherever it sits in the history. When file-save actions
 * are merged onto a real gate (the backend appends the Save/Cancel pair of a file proposed in the
 * same turn), the set is mixed and this function reports the gate as stale — `MessageActions`
 * then keeps the file-save buttons of that set clickable on their own, each until its own tempRef
 * stops awaiting an answer (`messageData.resolvedFileTempRefs`, written by `handleActionClick` on a
 * click and by `handlePollingResult` for tempRefs the backend's live snapshot no longer lists).
 *
 * `actionsResolved` covers what position alone cannot: the message whose own button was clicked
 * is still the last one until the server answers, yet its gate is already decided. The flag is
 * written by `handleActionClick` as soon as the POST returns a requestId — when the POST itself
 * fails the flag stays unset, so the buttons remain usable for a retry. A failure of the *polling*
 * that follows is not retriable: the flag is already written and nothing clears it, because the
 * action may well have been applied and a second send would duplicate it. It is written only for
 * dialog actions: a file-save click decides one file, not the gate, so it records a tempRef
 * instead — which is why a gate merged into a mixed set stays live if only its file half was
 * clicked, the gate itself never having been answered. The answer to that click keeps it live
 * too: it is stamped `isFileActionNotice` and skipped by `isSupersededByNewerMessage`, so a
 * decision that was never about the gate cannot move the dialog past it.
 *
 * Two related rules live outside this function. Freezing every gate while a request is in flight
 * belongs to the caller (`MessageList` renders with `stale || isLoading`), because a message list
 * alone cannot tell that a request is running. And a message is always addressed by its id or its
 * position, never by `action.id`: escalation gates reuse the ids of the gate they escalate
 * (`CONFIRM`, `SKIP`, `ABORT`, `deploy_confirm`), so matching by action id would disable siblings.
 *
 * @param {Array<{isError?: boolean, messageData?: {actions?: Array, actionsResolved?: boolean}}>} messages - full message list
 * @param {number} index - index of the message being rendered
 * @returns {boolean} true when the gate must be rendered as no longer live
 */
export const isGateStale = (messages, index) => {
  const message = messages && messages[index];
  if (!message) {
    return false;
  }
  const messageData = message.messageData;
  if (messageData && messageData.actionsResolved) {
    return true;
  }
  if (isFileSaveActionSet(messageData && messageData.actions)) {
    return false;
  }
  return isSupersededByNewerMessage(messages, index);
};

/**
 * Applies an agent selection under the rule the conversation binding demands.
 *
 * An agent switch rebinds the conversation server-side (`AgentOrchestratorService.resolveAgentRef`
 * stores the agent on it), so a dialog that is still alive has to be confirmed away and cleared
 * first — otherwise the next question continues the old history under the new agent. The chip may
 * therefore change only once the clearing actually happened: shown against a conversation that is
 * still there, it claims the opposite of the error the user has just been told.
 *
 * The confirmation lives here rather than at the call sites, and on the same `hasConversation` as
 * the clearing it guards, so that a new way of picking an agent cannot switch one silently. Asking
 * and clearing are one rule; split across the callers they were stated twice, in two different
 * shapes, and agreed only by accident.
 *
 * A chat with nothing to lose is the exception to both halves. Its conversation id has never been to
 * the backend, so there is nothing to warn about, and a DELETE refused with a 5xx says nothing about
 * the selection — gating on it took away the only way to pick an agent at all while the service was
 * briefly unreachable.
 *
 * Both entry points into an agent switch go through here: the selector dropdown in
 * `ChatContextTags`, and the «Настроить платформу» shortcut on the welcome screen — which is on show
 * exactly when the message list is empty, the state a reload leaves behind while the conversation
 * itself survives (D-B-14).
 *
 * @param {Object} params
 * @param {?Object} params.agent - The agent to select, null for the default "Citeck AI"
 * @param {boolean} params.hasConversation - Whether a dialog an agent switch would rebind is alive:
 *   a non-empty message list, or a conversation restored after a reload. Drives both the
 *   confirmation and the clearing.
 * @param {?Function} [params.clearConversation] - Clears the conversation, reporting the outcome as
 *   `Promise<boolean>`; anything but `true` is read as "the conversation is still there". Omitted
 *   when there is nothing to clear, so no DELETE is sent and no staged context is dropped.
 * @param {Function} params.selectAgent - Applies the selection
 * @returns {Promise<boolean>} True when the selection was applied
 */
export const applyAgentSwitch = async ({ agent, hasConversation, clearConversation, selectAgent }) => {
  if (hasConversation && !window.confirm(t('ai-agent.confirm-switch'))) {
    return false;
  }
  const cleared = clearConversation ? await clearConversation() : true;
  if (hasConversation && !cleared) {
    return false;
  }
  selectAgent?.(agent);
  return true;
};
