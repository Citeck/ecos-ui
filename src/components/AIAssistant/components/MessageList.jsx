import React from 'react';
import { MessageItem } from './messages';
import ChatWelcome from './ChatWelcome';
import { TAB_TYPES } from '../constants';

/**
 * Message list component that renders all chat messages
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects
 * @param {string} props.activeTab - Current active tab
 * @param {string} props.contextHint - Hint text for contextual tab
 * @param {Object} props.markdownComponents - Markdown component overrides
 * @param {Function} props.onCancelRequest - Cancel request handler
 * @param {Function} props.onCopyEmail - Copy email handler
 * @param {Function} props.onSendEmail - Send email handler
 * @param {Function} props.onApplyTextChanges - Apply text changes handler
 * @param {Function} props.onApplyScriptChanges - Apply script changes handler
 * @param {boolean} props.isApplyingTextChanges - Whether text changes are being applied
 * @param {boolean} props.isApplyingScriptChanges - Whether script changes are being applied
 * @param {boolean} props.isLoading - Whether request is loading
 * @param {string} props.activeRequestId - Active request ID (null if not polling)
 * @param {React.Ref} props.messagesEndRef - Ref to scroll to bottom
 */
const MessageList = ({
  messages,
  activeTab,
  contextHint,
  markdownComponents,
  onCancelRequest,
  onCopyEmail,
  onSendEmail,
  onApplyTextChanges,
  onApplyScriptChanges,
  isApplyingTextChanges,
  isApplyingScriptChanges,
  isLoading,
  activeRequestId,
  messagesEndRef,
  onActionClick
}) => {
  // Show welcome screen when no messages
  if (messages.length === 0) {
    return (
      <>
        <ChatWelcome
          activeTab={activeTab}
          contextHint={activeTab === TAB_TYPES.CONTEXTUAL ? contextHint : null}
        />
        <div ref={messagesEndRef} />
      </>
    );
  }

  return (
    <>
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          markdownComponents={markdownComponents}
          onCancelRequest={onCancelRequest}
          onCopyEmail={onCopyEmail}
          onSendEmail={onSendEmail}
          onApplyTextChanges={onApplyTextChanges}
          onApplyScriptChanges={onApplyScriptChanges}
          isApplyingTextChanges={isApplyingTextChanges}
          isApplyingScriptChanges={isApplyingScriptChanges}
          onActionClick={onActionClick}
        />
      ))}

      {/* Loading indicator when not using polling */}
      {isLoading && !activeRequestId && (
        <div className="ai-assistant-chat__message ai-assistant-chat__message--ai ai-assistant-chat__message--loading">
          <div className="ai-assistant-chat__loading-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  );
};

export default MessageList;
