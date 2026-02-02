import React from 'react';
import classNames from 'classnames';
import { Icon } from '../../common';
import { TAB_TYPES } from '../constants';
import { getStageStatus } from '../utils';

/**
 * Chat tabs component with Universal/Contextual switching and progress timeline
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab (universal/contextual)
 * @param {Function} props.onTabChange - Tab change handler
 * @param {boolean} props.hasContext - Whether contextual tab should be shown
 * @param {string} props.contextTitle - Title for contextual tab
 * @param {Object} props.businessAppProgress - Business app generation progress data
 * @param {Array} props.generationStages - Available generation stages
 */
const ChatTabs = ({
  activeTab,
  onTabChange,
  hasContext = false,
  contextTitle = 'Контекстный',
  businessAppProgress,
  generationStages
}) => {
  const showTimeline = businessAppProgress &&
    activeTab === TAB_TYPES.UNIVERSAL &&
    generationStages &&
    generationStages.length > 0;

  return (
    <div className="ai-assistant-chat__tabs">
      <button
        className={classNames(
          'ai-assistant-chat__tab',
          { 'ai-assistant-chat__tab--active': activeTab === TAB_TYPES.UNIVERSAL }
        )}
        onClick={() => onTabChange(TAB_TYPES.UNIVERSAL)}
      >
        <span>
          {businessAppProgress && activeTab === TAB_TYPES.UNIVERSAL
            ? 'Генерация бизнес-приложения'
            : 'Универсальный помощник'}
        </span>

        {/* Business App Generation Progress Timeline */}
        {showTimeline && (
          <div className="ai-assistant-chat__stage-timeline">
            {generationStages.map((stage, index) => {
              const status = getStageStatus(
                stage.key,
                businessAppProgress.progress || 0,
                stage.progressRange
              );
              const isLast = index === generationStages.length - 1;

              return (
                <div
                  key={stage.key}
                  className={classNames(
                    'ai-assistant-chat__stage-timeline-item',
                    {
                      'ai-assistant-chat__stage-timeline-item--completed': status === 'completed',
                      'ai-assistant-chat__stage-timeline-item--active': status === 'active',
                      'ai-assistant-chat__stage-timeline-item--pending': status === 'pending'
                    }
                  )}
                >
                  <div className="ai-assistant-chat__stage-timeline-marker">
                    {status === 'completed' && <Icon className="fa fa-check" />}
                    {status === 'active' && <span className="ai-assistant-chat__stage-timeline-pulse" />}
                    {status === 'pending' && <span className="ai-assistant-chat__stage-timeline-dot" />}
                  </div>
                  <div className="ai-assistant-chat__stage-timeline-label">{stage.label}</div>
                  {!isLast && <div className="ai-assistant-chat__stage-timeline-connector" />}
                </div>
              );
            })}
          </div>
        )}
      </button>

      {hasContext && (
        <button
          className={classNames(
            'ai-assistant-chat__tab',
            { 'ai-assistant-chat__tab--active': activeTab === TAB_TYPES.CONTEXTUAL }
          )}
          onClick={() => onTabChange(TAB_TYPES.CONTEXTUAL)}
          title={`Контекстный помощник - ${contextTitle}`}
        >
          <span>{contextTitle}</span>
        </button>
      )}
    </div>
  );
};

export default ChatTabs;
