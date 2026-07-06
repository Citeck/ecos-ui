import classNames from 'classnames';
import React from 'react';

import { FILE_SAVE_ACTION } from '../../constants';

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

// `messageId` is forwarded back through onActionClick so the action handler can clear the
// buttons of this specific message — actions ids alone are not unique (deploy_confirm and the
// plan-approval ids are stable across messages), so id-only matching would clear siblings too.
const MessageActions = ({ actions, messageId, onActionClick }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="ai-assistant-chat__message-actions">
      {orderActions(actions).map(action => (
        <button
          key={action.id}
          className={classNames('ai-assistant-chat__action-button', STYLE_MAP[action.style])}
          onClick={() => onActionClick?.(action.id, { messageId })}
        >
          {resolveActionLabel(action)}
        </button>
      ))}
    </div>
  );
};

export default MessageActions;
