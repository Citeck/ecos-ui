import React from 'react';
import classNames from 'classnames';
import { Icon } from '../../common';

/**
 * Chat header component with minimize and close buttons
 * @param {Object} props
 * @param {boolean} props.isMinimized - Whether chat is minimized
 * @param {Function} props.onMinimize - Minimize button click handler
 * @param {Function} props.onClose - Close button click handler
 * @param {string} props.title - Header title (default: 'Citeck AI')
 */
const ChatHeader = ({
  isMinimized,
  onMinimize,
  onClose,
  title = 'Citeck AI'
}) => {
  return (
    <div className="ai-assistant-chat__header">
      <h3 className="ai-assistant-chat__title">{title}</h3>
      <div className="ai-assistant-chat__header-actions">
        <button
          className="ai-assistant-chat__minimize"
          onClick={onMinimize}
          title={isMinimized ? 'Развернуть' : 'Свернуть'}
        >
          <Icon
            className={classNames(
              'ai-assistant-chat__icon',
              'fa',
              isMinimized ? 'fa-window-restore' : 'fa-window-minimize'
            )}
          />
        </button>
        <button
          className="ai-assistant-chat__close"
          onClick={onClose}
          title="Закрыть"
        >
          <Icon className="ai-assistant-chat__icon fa fa-times" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
