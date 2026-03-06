import React from 'react';
import classNames from 'classnames';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EmailMessage from './EmailMessage';
import TextDiffMessage from './TextDiffMessage';
import ScriptDiffMessage from './ScriptDiffMessage';
import BusinessAppMessage from './BusinessAppMessage';
import { formatMessageTime } from '../../utils';

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
  isApplyingScriptChanges
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

    // Business app progress message
    if (message.isBusinessAppContent && message.messageData) {
      return (
        <BusinessAppMessage
          message={message}
          markdownComponents={markdownComponents}
        />
      );
    }

    // Default markdown message
    return (
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {message.text}
      </Markdown>
    );
  };

  return (
    <div
      className={classNames(
        'ai-assistant-chat__message',
        `ai-assistant-chat__message--${message.sender}`,
        {
          'ai-assistant-chat__message--error': message.isError,
          'ai-assistant-chat__message--processing': message.isProcessing,
          'ai-assistant-chat__message--cancelled': message.isCancelled,
          'ai-assistant-chat__message--email': message.isEmailContent,
          'ai-assistant-chat__message--text-diff': message.isTextDiffContent,
          'ai-assistant-chat__message--script-diff': message.isScriptDiffContent,
          'ai-assistant-chat__message--business-app': message.isBusinessAppContent
        }
      )}
    >
      <div className="ai-assistant-chat__message-content">
        {renderContent()}
      </div>

      {/* Cancel button for processing messages */}
      {message.isProcessing && message.pollingIsUsed && (
        <div className="ai-assistant-chat__cancel-action">
          <button
            className="ai-assistant-chat__action-button ai-assistant-chat__action-button--cancel"
            onClick={onCancelRequest}
          >
            Отменить
          </button>
        </div>
      )}

      {/* Timestamp */}
      <div className="ai-assistant-chat__message-time">
        {formatMessageTime(message.timestamp)}
      </div>
    </div>
  );
};

export default MessageItem;
