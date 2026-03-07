import React from 'react';
import classNames from 'classnames';

const STYLE_MAP = {
  primary: 'ai-assistant-chat__action-button--apply',
  danger: 'ai-assistant-chat__action-button--cancel',
  default: ''
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
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default MessageActions;
