import React from 'react';
import classNames from 'classnames';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../../../common';
import ArtifactsList from './ArtifactsList';

/**
 * Business app generation progress message
 * @param {Object} props
 * @param {Object} props.message - Full message object
 * @param {Object} props.markdownComponents - Markdown component overrides
 */
const BusinessAppMessage = ({
  message,
  markdownComponents
}) => {
  const { messageData, text, isProcessing } = message;

  if (!messageData) return null;

  // Completed state - show final message with artifacts
  if (messageData.stage === 'COMPLETED') {
    return (
      <>
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {text}
        </Markdown>
        <ArtifactsList artifacts={messageData.artifacts} />
      </>
    );
  }

  // Progress state
  const stageMetadata = messageData.stageMetadata || {};
  const isInProgress = messageData.stage !== 'COMPLETED' && !messageData.error;
  const severity = stageMetadata.severity || 'INFO';
  const label = stageMetadata.label || 'Обработка';
  const icon = stageMetadata.icon || 'fa-cog';
  const description = stageMetadata.description;
  const animated = stageMetadata.animated !== undefined ? stageMetadata.animated : isProcessing;

  // Determine color based on severity
  let color = stageMetadata.color || '#2196F3';
  if (severity === 'ERROR') color = '#f44336';
  else if (severity === 'WARNING') color = '#ff9800';

  // Icons that should spin when animated
  const spinningIcons = ['fa-cog', 'fa-spinner', 'fa-circle-o-notch', 'fa-refresh', 'fa-sync'];
  const shouldSpin = animated === true && spinningIcons.includes(icon);

  return (
    <div className={classNames('ai-assistant-chat__progress-message', {
      [`ai-assistant-chat__progress-message--${severity.toLowerCase()}`]: true
    })}>
      {/* Header with icon and label */}
      <div className="ai-assistant-chat__progress-header-inline">
        <Icon
          className={classNames('fa', icon, { 'fa-spin': shouldSpin })}
          style={{ color }}
        />
        <span className="ai-assistant-chat__progress-label">{label}</span>
        {isInProgress && (
          <span className="ai-assistant-chat__progress-percentage">
            {messageData.progress || 0}%
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="ai-assistant-chat__progress-description">
          {description}
        </div>
      )}

      {/* Progress bar */}
      {isInProgress && messageData.progress !== undefined && (
        <div className="ai-assistant-chat__progress-bar-thin">
          <div
            className="ai-assistant-chat__progress-fill"
            style={{
              width: `${messageData.progress || 0}%`,
              backgroundColor: color,
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>
      )}

      {/* Retry attempts */}
      {messageData.currentAttempt > 1 && messageData.maxAttempts && (
        <div className="ai-assistant-chat__progress-attempts">
          Попытка {messageData.currentAttempt} из {messageData.maxAttempts}
        </div>
      )}

      {/* Detailed status */}
      <div className="ai-assistant-chat__progress-content">
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {messageData.detailedStatus || text || messageData.message}
        </Markdown>
      </div>

      {/* Artifacts (if any at this stage) */}
      <ArtifactsList artifacts={messageData.artifacts} />
    </div>
  );
};

export default BusinessAppMessage;
