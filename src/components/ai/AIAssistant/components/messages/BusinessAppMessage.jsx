import classNames from 'classnames';
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import ArtifactsList from './ArtifactsList';
import MessageActions from './MessageActions';

import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';

/**
 * Business app generation progress message
 * @param {Object} props
 * @param {Object} props.message - Full message object
 * @param {Object} props.markdownComponents - Markdown component overrides
 * @param {Function} props.onActionClick - Action button handler (SKIP/CANCEL on the clarifying-questions card)
 * @param {boolean} props.actionsDisabled - Whether this gate is no longer live (see MessageList)
 * @param {boolean} props.actionsStale - The same, without the in-flight freeze folded in; decides
 *   whether the buttons are painted retired, as opposed to merely being locked for a round trip
 */
const BusinessAppMessage = ({
  message,
  markdownComponents,
  onActionClick,
  actionsDisabled = false,
  actionsFrozen = false,
  actionsStale = false
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
  // A cancelled turn is flagged on the message (`cancelRequest` / `handlePollingCancelled`), never on
  // `messageData` — and this card renders from `messageData` alone. Without reading the flag it kept
  // the stage label, the percentage, the filled bar and the spinning cog of a generation the user had
  // already stopped, while the stage ribbon above it was being taken down (COREDEV-484, A6). The
  // failure path needs no such handling: `handlePollingError` stamps `messageData.error`.
  const cancelled = !messageData.error && !!message.isCancelled;
  const isInProgress = messageData.stage !== 'COMPLETED' && !messageData.error && !cancelled;
  const severity = stageMetadata.severity || 'INFO';
  const label = cancelled ? t('ai-assistant.chat.cancelled-title') : stageMetadata.label || t('ai-assistant.business-app.default-label');
  const icon = cancelled ? 'fa-ban' : stageMetadata.icon || 'fa-cog';
  // Both narration fields belong to the last poll of a run that is over: the description under the
  // header and the detailed status in the content block below. Muting only the label, the
  // percentage and the bar left the card announcing «Запрос отменён» over a body still saying
  // «Создаю формы» (COREDEV-484, A6). A cancelled card therefore keeps its header and nothing else:
  // the only other candidate for the body is `text`, and on this path that is the generic
  // cancellation notice — the very sentence the header already carries, printed twice under itself.
  // Same shape as the cancelled `AgentProgressMessage`, which shows the header alone.
  const description = cancelled ? null : stageMetadata.description;
  const content = cancelled ? null : messageData.detailedStatus || text || messageData.message;
  const animated = stageMetadata.animated !== undefined ? stageMetadata.animated : isProcessing;

  // Determine color based on severity
  let color = stageMetadata.color || '#2196F3';
  if (severity === 'ERROR') color = '#f44336';
  else if (severity === 'WARNING') color = '#ff9800';
  if (cancelled) color = '#9e9e9e';

  // Icons that should spin when animated
  const spinningIcons = ['fa-cog', 'fa-spinner', 'fa-circle-o-notch', 'fa-refresh', 'fa-sync'];
  const shouldSpin = animated === true && !cancelled && spinningIcons.includes(icon);

  return (
    <div
      className={classNames('ai-assistant-chat__progress-message', {
        [`ai-assistant-chat__progress-message--${severity.toLowerCase()}`]: true
      })}
    >
      {/* Header with icon and label */}
      <div className="ai-assistant-chat__progress-header-inline">
        <Icon className={classNames('fa', icon, { 'fa-spin': shouldSpin })} style={{ color }} />
        <span className="ai-assistant-chat__progress-label">{label}</span>
        {isInProgress && <span className="ai-assistant-chat__progress-percentage">{messageData.progress || 0}%</span>}
      </div>

      {/* Description */}
      {description && <div className="ai-assistant-chat__progress-description">{description}</div>}

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

      {/* Retry attempts — a dead card must not go on announcing which attempt is running, and a
          failed one is just as dead as a cancelled one: `isInProgress` covers both stamps at once */}
      {isInProgress && messageData.currentAttempt > 1 && messageData.maxAttempts && (
        <div className="ai-assistant-chat__progress-attempts">
          {t('ai-assistant.business-app.attempt', { current: messageData.currentAttempt, total: messageData.maxAttempts })}
        </div>
      )}

      {/* Detailed status */}
      {content && (
        <div className="ai-assistant-chat__progress-content">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </Markdown>
        </div>
      )}

      {/* Artifacts (if any at this stage) */}
      <ArtifactsList artifacts={messageData.artifacts} />

      {/* Action buttons (e.g. Пропустить / Отмена on the clarifying-questions card) */}
      {messageData.actions?.length > 0 && (
        <MessageActions
          actions={messageData.actions}
          messageId={message.id}
          onActionClick={onActionClick}
          disabled={actionsDisabled}
          frozen={actionsFrozen}
          stale={actionsStale}
          resolvedFileTempRefs={messageData.resolvedFileTempRefs}
        />
      )}
    </div>
  );
};

export default BusinessAppMessage;
