import React, { useEffect } from 'react';

import { t } from '@/helpers/export/util';
import { Icon } from '../../common';
import { FILE_UPLOAD_ACCEPT_STRING } from '../constants';

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
  onFileUpload
}) => {
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message, textareaRef]);

  const placeholder = isUniversal
    ? t('ai-assistant.input.placeholder.universal')
    : t('ai-assistant.input.placeholder.contextual');

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
            data-tooltip={isUploadingFile ? t('ai-assistant.input.uploading') : t('ai-assistant.input.upload')}
          >
            <Icon className={isUploadingFile ? 'fa fa-spinner fa-spin' : 'fa fa-paperclip'} />
          </button>
          <button
            type="button"
            className="ai-assistant-chat__floating-action ai-assistant-chat__floating-action--clear-context"
            onClick={onClearConversation}
            data-tooltip={t('ai-assistant.input.clear-context')}
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
