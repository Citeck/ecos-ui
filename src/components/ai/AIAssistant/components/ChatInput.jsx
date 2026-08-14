import React, { useEffect } from 'react';

import { AGENT_ENGINE, FILE_UPLOAD_ACCEPT_STRING, getAgentEngine } from '@/components/ai/AIAssistant/constants';
import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';

/**
 * Chat input component with textarea and action buttons
 * @param {Object} props
 * @param {React.Ref} props.textareaRef - Ref for textarea element
 * @param {string} props.message - Current input value
 * @param {boolean} props.isLoading - Whether request is in progress
 * @param {boolean} props.isUniversal - Whether this is universal chat mode
 * @param {boolean} props.isUploadingFile - Whether file is being uploaded
 * @param {Function} props.onInputChange - Input change handler (value, isUniversal)
 * @param {Function} props.onKeyDown - Key down handler (event, isUniversal)
 * @param {Function} props.onFileUploadClick - File upload button click handler
 * @param {Function} props.onClearConversation - Clear conversation handler
 * @param {React.Ref} props.fileInputRef - Ref for file input element
 * @param {Function} props.onFileUpload - File upload handler
 * @param {Object} [props.selectedAgent] - Selected agent list item (carries `engine`); drives the placeholder wording
 */
const ChatInput = ({
  textareaRef,
  message,
  isLoading = false,
  isUniversal = true,
  isUploadingFile = false,
  onInputChange,
  onKeyDown,
  onFileUploadClick,
  onClearConversation,
  fileInputRef,
  onFileUpload,
  selectedAgent
}) => {
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message, textareaRef]);

  // The contextual tab always talks about the record at hand. On the universal tab the wording follows
  // the engine of the selected agent: a CONFIG agent creates artifacts ("describe what you want to create"),
  // while an operational TOOL_LOOP agent answers questions about tasks/documents/records. With no agent
  // selected the chat is not routed yet, so the neutral universal wording stays.
  const resolvePlaceholderKey = () => {
    if (!isUniversal) return 'ai-assistant.input.placeholder.contextual';
    if (!selectedAgent) return 'ai-assistant.input.placeholder.universal';

    return getAgentEngine(selectedAgent) === AGENT_ENGINE.CONFIG
      ? 'ai-assistant.input.placeholder.universal'
      : 'ai-assistant.input.placeholder.operational';
  };

  const placeholder = t(resolvePlaceholderKey());
  // `data-tooltip` is drawn by a CSS pseudo-element and gives no accessible name, so the same
  // wording goes into `aria-label` — that is what a screen reader (and Playwright) reads.
  const uploadLabel = isUploadingFile ? t('ai-assistant.input.uploading') : t('ai-assistant.input.upload');
  const clearContextLabel = t('ai-assistant.input.clear-context');

  return (
    <div className="ai-assistant-chat__input-wrapper">
      <textarea
        ref={textareaRef}
        className="ai-assistant-chat__input"
        value={message}
        onChange={e => onInputChange(e, isUniversal)}
        onKeyDown={e => onKeyDown(e, isUniversal)}
        disabled={isLoading}
        rows={1}
        placeholder={placeholder}
      />
      {isUniversal && (
        <div className="ai-assistant-chat__input-actions">
          <button
            type="button"
            className="ai-assistant-chat__floating-action ai-assistant-chat__floating-action--file-upload"
            onClick={onFileUploadClick}
            disabled={isUploadingFile}
            data-tooltip={uploadLabel}
            aria-label={uploadLabel}
          >
            <Icon className={isUploadingFile ? 'fa fa-spinner fa-spin' : 'fa fa-paperclip'} />
          </button>
          <button
            type="button"
            className="ai-assistant-chat__floating-action ai-assistant-chat__floating-action--clear-context"
            onClick={onClearConversation}
            data-tooltip={clearContextLabel}
            aria-label={clearContextLabel}
          >
            <Icon className="fa fa-trash-o" />
          </button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={FILE_UPLOAD_ACCEPT_STRING}
        style={{ display: 'none' }}
        onChange={e => onFileUpload(e.target.files)}
      />
    </div>
  );
};

export default ChatInput;
