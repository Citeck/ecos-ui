import React from 'react';
import { Icon } from '../../common';
import { ADDITIONAL_CONTEXT_TYPES } from '../constants';

/**
 * Context tags component showing selected context items
 * @param {Object} props
 * @param {string[]} props.selectedAdditionalContext - Selected context types
 * @param {Object} props.additionalContext - Additional context data (records, documents, attributes)
 * @param {Object} props.selectedTextContext - Selected text context
 * @param {Object} props.scriptContext - Script context data
 * @param {Array} props.uploadedFiles - List of uploaded files
 * @param {Array} props.uploadingFiles - List of files being uploaded
 * @param {Function} props.onToggleContext - Handler to toggle context item
 * @param {Function} props.onRemoveTextContext - Handler to remove text context
 * @param {Function} props.onRemoveScriptContext - Handler to remove script context
 * @param {Function} props.onRemoveFile - Handler to remove uploaded file
 * @param {Function} props.getScriptContextLabel - Function to get script context label
 */
const ChatContextTags = ({
  selectedAdditionalContext = [],
  additionalContext = { records: [], documents: [], attributes: [] },
  selectedTextContext,
  scriptContext,
  uploadedFiles = [],
  uploadingFiles = [],
  onToggleContext,
  onRemoveSelectedText,
  onRemoveScriptContext,
  onRemoveUploadedFile,
  getScriptContextLabel
}) => {
  const hasContent = selectedAdditionalContext.length > 0 ||
    selectedTextContext ||
    uploadedFiles.length > 0 ||
    uploadingFiles.length > 0 ||
    scriptContext;

  if (!hasContent) return null;

  return (
    <div className="ai-assistant-chat__context-tags">
      {/* Selected text context */}
      {selectedTextContext && (
        <div className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--selected-text">
          <span>
            Текст: "{selectedTextContext.text.length > 50
              ? selectedTextContext.text.substring(0, 50) + '...'
              : selectedTextContext.text}"
          </span>
          <button
            className="ai-assistant-chat__context-tag-remove"
            onClick={onRemoveSelectedText}
            title="Удалить текст из контекста"
          >
            <Icon className="fa fa-times" />
          </button>
        </div>
      )}

      {/* Current record context */}
      {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) &&
        additionalContext.records.map((record, index) => (
          <div
            key={`${ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD}-${index}`}
            className="ai-assistant-chat__context-tag"
          >
            <span>{record.displayName || record.recordRef || 'Карточка'}</span>
            <button
              className="ai-assistant-chat__context-tag-remove"
              onClick={() => onToggleContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, record)}
              title="Удалить из контекста"
            >
              <Icon className="fa fa-times" />
            </button>
          </div>
        ))
      }

      {/* Documents context */}
      {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) &&
        additionalContext.documents.map((document, index) => (
          <div
            key={`${ADDITIONAL_CONTEXT_TYPES.DOCUMENTS}-${index}`}
            className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--document"
          >
            <span>{document.displayName || document.recordRef || 'Документ'}</span>
            <button
              className="ai-assistant-chat__context-tag-remove"
              onClick={() => onToggleContext(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS, document)}
              title="Удалить документ из контекста"
            >
              <Icon className="fa fa-times" />
            </button>
          </div>
        ))
      }

      {/* Attributes context */}
      {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES) &&
        additionalContext.attributes.map((attribute, index) => (
          <div
            key={`${ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES}-${index}`}
            className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--attribute"
          >
            <span>{'Атрибут: ' + (attribute.displayName || attribute.attribute)}</span>
            <button
              className="ai-assistant-chat__context-tag-remove"
              onClick={() => onToggleContext(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES, attribute)}
              title="Удалить атрибут из контекста"
            >
              <Icon className="fa fa-times" />
            </button>
          </div>
        ))
      }

      {/* Script context */}
      {scriptContext && (
        <div className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--script">
          <Icon className="fa fa-code" />
          <span>{getScriptContextLabel ? getScriptContextLabel(scriptContext.scriptContextType) : 'Script'}</span>
          <button
            className="ai-assistant-chat__context-tag-remove"
            onClick={onRemoveScriptContext}
            title="Удалить скрипт из контекста"
          >
            <Icon className="fa fa-times" />
          </button>
        </div>
      )}

      {/* Uploading files */}
      {uploadingFiles.map((file) => (
        <div
          key={file.id}
          className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--uploaded-file"
        >
          <Icon className="fa fa-spinner fa-spin" />
          <span>{file.name}</span>
        </div>
      ))}

      {/* Uploaded files */}
      {uploadedFiles.map((file, index) => (
        <div
          key={`uploaded-file-${index}`}
          className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--uploaded-file"
        >
          <Icon className="fa fa-file" />
          <span>{file.name}</span>
          <button
            className="ai-assistant-chat__context-tag-remove"
            onClick={() => onRemoveUploadedFile(file)}
            title="Удалить файл"
          >
            <Icon className="fa fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChatContextTags;
