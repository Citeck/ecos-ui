import React, { useState, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Icon } from '../../common';
import { t } from '@/helpers/export/util';
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
 * Chat header component with minimize, close and export buttons
 */
const ChatHeader = ({
  isMinimized,
  onMinimize,
  onClose,
  title = 'Citeck AI',
  agentStatus = null,
  selectedAgent = null,
  onExportMarkdown,
  onExportHtml,
  hasMessages = false
}) => {
  const isAgentActive = agentStatus && ACTIVE_AGENT_STATUSES.includes(agentStatus);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);

  const handleClickOutside = useCallback((event) => {
    if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
      setShowExportDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown, handleClickOutside]);

  return (
    <div className="ai-assistant-chat__header">
      <div className="ai-assistant-chat__header-left">
        <h3 className="ai-assistant-chat__title">{selectedAgent ? selectedAgent.name : title}</h3>
        {isAgentActive && (
          <span className="ai-assistant-chat__agent-badge" title={AGENT_STATUS_LABELS[agentStatus]}>
            <Icon className="ai-assistant-chat__agent-badge-icon fa fa-robot" />
            <span className="ai-assistant-chat__agent-badge-text">Agent</span>
          </span>
        )}
      </div>
      <div className="ai-assistant-chat__header-actions" ref={exportDropdownRef}>
        {hasMessages && (
          <>
            <button
              className="ai-assistant-chat__minimize"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              title={t('ai-assistant.export.button-title')}
            >
              <Icon className="ai-assistant-chat__icon fa fa-download" />
            </button>
            {showExportDropdown && (
              <div className="ai-assistant-chat__export-dropdown">
                <div
                  className="ai-assistant-chat__export-dropdown-item"
                  onClick={() => {
                    onExportMarkdown?.();
                    setShowExportDropdown(false);
                  }}
                >
                  Markdown (.md)
                </div>
                <div
                  className="ai-assistant-chat__export-dropdown-item"
                  onClick={() => {
                    onExportHtml?.();
                    setShowExportDropdown(false);
                  }}
                >
                  HTML (.html)
                </div>
              </div>
            )}
          </>
        )}
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
