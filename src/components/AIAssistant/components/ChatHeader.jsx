import React from 'react';
import classNames from 'classnames';
import { Icon } from '../../common';
import { AGENT_STATUSES } from '../types';

const ACTIVE_AGENT_STATUSES = [
  AGENT_STATUSES.PLANNING,
  AGENT_STATUSES.WAITING_PLAN_APPROVAL,
  AGENT_STATUSES.EXECUTING,
  AGENT_STATUSES.WAITING_STEP_APPROVAL
];

const AGENT_STATUS_LABELS = {
  [AGENT_STATUSES.PLANNING]: 'Планирование',
  [AGENT_STATUSES.WAITING_PLAN_APPROVAL]: 'Ожидание подтверждения',
  [AGENT_STATUSES.EXECUTING]: 'Выполнение',
  [AGENT_STATUSES.WAITING_STEP_APPROVAL]: 'Ожидание подтверждения шага'
};

/**
 * Chat header component with minimize and close buttons
 * @param {Object} props
 * @param {boolean} props.isMinimized - Whether chat is minimized
 * @param {Function} props.onMinimize - Minimize button click handler
 * @param {Function} props.onClose - Close button click handler
 * @param {string} props.title - Header title (default: 'Citeck AI')
 * @param {string|null} props.agentStatus - Current agent status
 */
const ChatHeader = ({
  isMinimized,
  onMinimize,
  onClose,
  title = 'Citeck AI',
  agentStatus = null
}) => {
  const isAgentActive = agentStatus && ACTIVE_AGENT_STATUSES.includes(agentStatus);

  return (
    <div className="ai-assistant-chat__header">
      <h3 className="ai-assistant-chat__title">{title}</h3>
      {isAgentActive && (
        <span className="ai-assistant-chat__agent-badge" title={AGENT_STATUS_LABELS[agentStatus]}>
          <Icon className="ai-assistant-chat__agent-badge-icon fa fa-robot" />
          <span className="ai-assistant-chat__agent-badge-text">Agent</span>
        </span>
      )}
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

export { ACTIVE_AGENT_STATUSES, AGENT_STATUS_LABELS };
export default ChatHeader;
