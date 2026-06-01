import React from 'react';
import classNames from 'classnames';

import { t } from '@/helpers/export/util';

const STYLE_MAP = {
  primary: 'ai-assistant-chat__action-button--apply',
  danger: 'ai-assistant-chat__action-button--cancel',
  default: ''
};

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

const resolveActionLabel = (action) => {
  const directKey = ACTION_LABEL_KEYS[action.id];
  if (directKey) {
    return t(directKey);
  }
  // File-save cancel id has form "file_cancel" or "file_cancel|<tempRef>"
  if (typeof action.id === 'string' && action.id.split('|')[0] === 'file_cancel') {
    return t('ai-assistant.action.cancel');
  }
  return action.label;
};

const MessageActions = ({ actions, onActionClick }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="ai-assistant-chat__message-actions">
      {actions.map((action) => (
        <button
          key={action.id}
          className={classNames('ai-assistant-chat__action-button', STYLE_MAP[action.style])}
          onClick={() => onActionClick?.(action.id)}
        >
          {resolveActionLabel(action)}
        </button>
      ))}
    </div>
  );
};

export default MessageActions;
