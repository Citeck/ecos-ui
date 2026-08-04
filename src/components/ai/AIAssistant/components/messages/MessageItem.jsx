import classNames from 'classnames';
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { formatMessageTime } from '../../utils';

import AgentPlanMessage from './AgentPlanMessage';
import AgentProgressMessage from './AgentProgressMessage';
import ArtifactsList from './ArtifactsList';
import BusinessAppMessage from './BusinessAppMessage';
import ContextArtifactsList from './ContextArtifactsList';
import DeployConfirmation from './DeployConfirmation';
import EmailMessage from './EmailMessage';
import MessageActions from './MessageActions';
import ScriptDiffMessage from './ScriptDiffMessage';
import TextDiffMessage from './TextDiffMessage';

import { t } from '@/helpers/export/util';

/**
 * Message item component that renders appropriate message type
 * @param {Object} props
 * @param {Object} props.message - Message object
 * @param {Object} props.markdownComponents - Markdown component overrides
 * @param {Function} props.onCancelRequest - Cancel request handler
 * @param {Function} props.onCopyEmail - Copy email handler
 * @param {Function} props.onSendEmail - Send email handler
 * @param {Function} props.onApplyTextChanges - Apply text changes handler
 * @param {Function} props.onApplyScriptChanges - Apply script changes handler
 * @param {boolean} props.isApplyingTextChanges - Whether text changes are being applied
 * @param {boolean} props.isApplyingScriptChanges - Whether script changes are being applied
 * @param {boolean} props.actionsDisabled - Whether the gate of this message is no longer live (the
 *   dialog has moved past it, or a request is in flight); computed in MessageList
 * @param {boolean} props.actionsFrozen - Whether a request is in flight (a subset of actionsDisabled);
 *   file-save buttons are exempt from staleness but never from this freeze
 * @param {boolean} props.actionsStale - Whether the gate of this message is no longer live, without
 *   the in-flight freeze folded in; drives what a card displays (the deploy scope it sent, the hint
 *   it is waiting on) as opposed to what it lets the user click
 * @param {Function} props.onSelectDeployScope - (messageId, scopeKey) => void; records a deploy
 *   card's draft scope on the message so it survives the unmount that minimizing the chat causes
 */
const MessageItem = ({
  message,
  markdownComponents,
  onCancelRequest,
  onCopyEmail,
  onSendEmail,
  onApplyTextChanges,
  onApplyScriptChanges,
  isApplyingTextChanges,
  isApplyingScriptChanges,
  onActionClick,
  onSelectDeployScope,
  actionsDisabled = false,
  actionsFrozen = false,
  actionsStale = false
}) => {
  const renderContent = () => {
    // Email message
    if (message.isEmailContent && message.messageData) {
      return (
        <EmailMessage
          messageData={message.messageData}
          markdownComponents={markdownComponents}
          onCopy={() => onCopyEmail?.(message.messageData)}
          onSend={() => onSendEmail?.(message.messageData)}
        />
      );
    }

    // Text diff message
    if (message.isTextDiffContent && message.messageData) {
      return (
        <TextDiffMessage
          text={message.text}
          messageData={message.messageData}
          markdownComponents={markdownComponents}
          onApplyChanges={() => onApplyTextChanges?.(message.messageData)}
          isApplying={isApplyingTextChanges}
        />
      );
    }

    // Script diff message
    if (message.isScriptDiffContent && message.messageData) {
      return (
        <ScriptDiffMessage
          text={message.text}
          messageData={message.messageData}
          onApplyChanges={() => onApplyScriptChanges?.(message.messageData)}
          isApplying={isApplyingScriptChanges}
        />
      );
    }

    // Agent plan message (plan approval, step approval, completed, failed)
    if (message.isAgentPlanContent) {
      return (
        <AgentPlanMessage
          message={message}
          markdownComponents={markdownComponents}
          onActionClick={onActionClick}
          actionsDisabled={actionsDisabled}
          actionsFrozen={actionsFrozen}
          actionsStale={actionsStale}
        />
      );
    }

    // Agent progress message (planning, executing)
    if (message.isAgentProgressContent) {
      return <AgentProgressMessage message={message} />;
    }

    // Business app progress message
    if (message.isBusinessAppContent && message.messageData) {
      return (
        <BusinessAppMessage
          message={message}
          markdownComponents={markdownComponents}
          onActionClick={onActionClick}
          actionsDisabled={actionsDisabled}
          actionsFrozen={actionsFrozen}
          actionsStale={actionsStale}
        />
      );
    }

    // Config-agent HITL deploy confirmation (pendingDeploy in result, COREDEV-323 contract #3)
    if (message.messageData?.pendingDeploy) {
      return (
        <DeployConfirmation
          message={message}
          markdownComponents={markdownComponents}
          onActionClick={onActionClick}
          onSelectDeployScope={onSelectDeployScope}
          actionsDisabled={actionsDisabled}
          actionsFrozen={actionsFrozen}
          actionsStale={actionsStale}
        />
      );
    }

    // Default markdown message
    return (
      <>
        <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {message.text}
        </Markdown>
        {message.messageData?.artifacts && <ArtifactsList artifacts={message.messageData.artifacts} />}
        {message.messageData?.contextArtifacts && <ContextArtifactsList contextArtifacts={message.messageData.contextArtifacts} />}
        {message.messageData?.actions && (
          <MessageActions
            actions={message.messageData.actions}
            messageId={message.id}
            onActionClick={onActionClick}
            disabled={actionsDisabled}
            frozen={actionsFrozen}
            stale={actionsStale}
            resolvedFileTempRefs={message.messageData.resolvedFileTempRefs}
          />
        )}
      </>
    );
  };

  return (
    <div
      className={classNames('ai-assistant-chat__message', `ai-assistant-chat__message--${message.sender}`, {
        'ai-assistant-chat__message--error': message.isError,
        'ai-assistant-chat__message--processing': message.isProcessing,
        'ai-assistant-chat__message--cancelled': message.isCancelled,
        'ai-assistant-chat__message--email': message.isEmailContent,
        'ai-assistant-chat__message--text-diff': message.isTextDiffContent,
        'ai-assistant-chat__message--script-diff': message.isScriptDiffContent,
        'ai-assistant-chat__message--business-app': message.isBusinessAppContent,
        'ai-assistant-chat__message--agent-plan': message.isAgentPlanContent,
        'ai-assistant-chat__message--agent-progress': message.isAgentProgressContent,
        'ai-assistant-chat__message--deploy-confirm': !!message.messageData?.pendingDeploy
      })}
    >
      <div className="ai-assistant-chat__message-content">{renderContent()}</div>

      {/* Cancel button for processing messages */}
      {message.isProcessing && message.pollingIsUsed && (
        <div className="ai-assistant-chat__cancel-action">
          <button className="ai-assistant-chat__action-button ai-assistant-chat__action-button--cancel" onClick={onCancelRequest}>
            {t('ai-assistant.action.cancel')}
          </button>
        </div>
      )}

      {/* Timestamp */}
      <div className="ai-assistant-chat__message-time">{formatMessageTime(message.timestamp)}</div>
    </div>
  );
};

export default MessageItem;
