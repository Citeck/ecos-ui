import React, { useMemo } from 'react';

import ChatWelcome from './ChatWelcome';
import { MessageItem } from './messages';

import { TAB_TYPES } from '@/components/ai/AIAssistant/constants';
import { isGateStale } from '@/components/ai/AIAssistant/utils';

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
 * @param {Function} props.onSelectDeployScope - (messageId, scopeKey) => void; records the deploy
 *   scope a card is set to send on the message itself, so the draft survives the unmount of this
 *   list when the chat window is minimized
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
  onActionClick,
  onSelectDeployScope,
  onSelectAgent
}) => {
  // Staleness is derived from the position of a message in the list, so it is recomputed here —
  // the only place that knows the whole history — instead of being written into message state.
  // A gate goes stale once the dialog has moved past it: a later message that actually advanced it
  // (a free-text reply, the agent's next answer) disables the buttons of the gates left behind.
  // Not every appended message advances the dialog, though — a cancellation, an error and a failed
  // send report that the turn did NOT happen, and a notice about a file click answers a resource
  // rather than the gate; `isGateStale` exempts those, see its own documentation for the full list.
  const staleFlags = useMemo(() => messages.map((_, index) => isGateStale(messages, index)), [messages]);

  // Show welcome screen when no messages
  if (messages.length === 0) {
    return (
      <>
        <ChatWelcome
          activeTab={activeTab}
          contextHint={activeTab === TAB_TYPES.CONTEXTUAL ? contextHint : null}
          onSelectAgent={onSelectAgent}
        />
        <div ref={messagesEndRef} />
      </>
    );
  }

  return (
    <>
      {messages.map((msg, index) => (
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
          onSelectDeployScope={onSelectDeployScope}
          // While a request is in flight every gate is frozen — this closes the window between
          // the click and the server answer in which a second action could still be sent. The
          // freeze is also forwarded on its own, because it is the one condition that admits no
          // exception: a stale gate may still carry live file-save buttons, an in-flight one may not.
          actionsDisabled={staleFlags[index] || !!isLoading}
          actionsFrozen={!!isLoading}
          // Staleness on its own, without the freeze folded in. What a card *shows* must follow
          // whether the gate is still live, not whether some request happens to be running: the
          // freeze is transient and says nothing about this gate, so mixing it in makes a card
          // report a decision it has not taken yet for the duration of the round trip.
          actionsStale={staleFlags[index]}
        />
      ))}

      {/* Loading indicator when not using polling */}
      {isLoading && !activeRequestId && (
        <div className="ai-assistant-chat__message ai-assistant-chat__message--ai ai-assistant-chat__message--loading">
          <div className="ai-assistant-chat__loading-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  );
};

export default MessageList;
