import classNames from 'classnames';
import React from 'react';

import { FILE_SAVE_ACTION } from '../../constants';
import { fileSaveActionTempRef } from '../../utils';

import { t } from '@/helpers/export/util';

const STYLE_MAP = {
  primary: 'ai-assistant-chat__action-button--apply',
  danger: 'ai-assistant-chat__action-button--cancel',
  default: ''
};

// Platform convention (cf. RemoveDialog): the positive/primary action sits on the right,
// cancel/reject on the left. The backend emits actions positive-first, so we reorder by
// style rank — danger (cancel) leftmost, primary (apply) rightmost — with a stable sort
// that preserves the backend's relative order within the same rank.
const STYLE_ORDER = { danger: 0, default: 1, primary: 2 };
const styleRank = action => STYLE_ORDER[action.style] ?? STYLE_ORDER.default;
const orderActions = actions => [...actions].sort((a, b) => styleRank(a) - styleRank(b));

// Backend sends labels for these stable action ids in Russian.
// We translate known ids on the client and fall back to action.label otherwise.
const ACTION_LABEL_KEYS = {
  CONFIRM: 'ai-assistant.action.confirm',
  REJECT: 'ai-assistant.action.reject',
  RETRY: 'ai-assistant.action.retry',
  SKIP: 'ai-assistant.action.skip',
  ABORT: 'ai-assistant.action.cancel',
  MODIFY: 'ai-assistant.action.modify'
};

const resolveActionLabel = action => {
  const directKey = ACTION_LABEL_KEYS[action.id];
  if (directKey) {
    return t(directKey);
  }
  // File-save cancel id has form "file_cancel" or "file_cancel|<tempRef>"
  if (typeof action.id === 'string' && action.id.split(FILE_SAVE_ACTION.TEMP_REF_SEPARATOR)[0] === FILE_SAVE_ACTION.CANCEL) {
    return t('ai-assistant.action.cancel');
  }
  return action.label;
};

// `messageId` is forwarded back through onActionClick so the action handler can mark the
// buttons of this specific message as resolved — action ids alone are not unique (deploy_confirm
// and the plan-approval ids are stable across messages), so id-only matching would hit siblings too.
//
// `disabled` comes from `isGateStale` (plus the in-flight request flag): the gate these buttons
// belong to is no longer live. Buttons stay rendered — the history must remain readable and the
// layout must not jump — but they are muted and the DOM attribute blocks the click.
//
// What a button *shows* follows `stale` alone, never `disabled`: the latter folds in the freeze,
// which is transient and says nothing about this gate. Painting the freeze with the retired look
// greyed out every button in the history for the length of any request — a config-agent run lasts
// minutes — so a gate still waiting for an answer was indistinguishable from one already decided,
// which is the distinction these styles exist to draw. `DeployConfirmation` splits its radio
// options the same way (display follows staleness, interactivity follows the freeze).
//
// A file-save button is exempt from staleness: it is tied to its own temp file rather than to the
// step of the dialog it was offered in. The backend merges the Save/Cancel pair of a file proposed
// in a turn onto whatever gate that same turn produced, and it does not re-emit that pair on a
// later free-text turn — so disabling the whole mixed set would leave a still-pending file with no
// way to be saved or cancelled. `frozen` (a request is in flight) admits no such exception: while
// one action is on the wire no second one may be sent.
//
// The exemption lasts only until that file is decided. `resolvedFileTempRefs` lists the tempRefs of
// this message that are no longer awaiting an answer — either clicked (`handleActionClick`) or absent
// from the backend's live snapshot (`handlePollingResult` reading `result.pendingFiles`) — and their
// buttons are disabled regardless of `disabled`: one message can carry the pairs of several files at
// once (the backend emits a pair per new pending), so a single per-message flag cannot express which
// of them is done. Without this the temp file's preview is stripped from the text on save while its
// buttons come back to life, and a second click would re-send an action for a temp file the backend
// has already consumed and deleted.
const MessageActions = ({ actions, messageId, onActionClick, disabled = false, frozen = false, stale = false, resolvedFileTempRefs }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="ai-assistant-chat__message-actions">
      {orderActions(actions).map(action => {
        const tempRef = fileSaveActionTempRef(action.id);
        const isResolvedFileAction = !!tempRef && !!resolvedFileTempRefs && resolvedFileTempRefs.includes(tempRef);
        const isDisabled = frozen || isResolvedFileAction || (disabled && !tempRef);
        // A decided file is retired for good, so it is marked as such whatever the gate does.
        const isStale = isResolvedFileAction || (stale && !tempRef);
        return (
          <button
            key={action.id}
            className={classNames('ai-assistant-chat__action-button', STYLE_MAP[action.style], {
              'ai-assistant-chat__action-button--stale': isStale
            })}
            disabled={isDisabled}
            onClick={() => onActionClick?.(action.id, { messageId })}
          >
            {resolveActionLabel(action)}
          </button>
        );
      })}
    </div>
  );
};

export default MessageActions;
