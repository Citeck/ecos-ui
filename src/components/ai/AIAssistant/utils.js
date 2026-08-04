/**
 * Utility functions for AIAssistant components
 */

import { FILE_SAVE_ACTION } from './constants';

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
