import React from 'react';
import { Icon } from '../../common';
import { ADDITIONAL_CONTEXT_TYPES, getContextArtifactIcon, getRecordRefIcon } from '../constants';
import { getTextByLocale } from '../../../helpers/util';

/**
 * Icon mapping for context types
 */
export const CONTEXT_TYPE_ICONS = {
  records: 'fa-database',
  documents: 'fa-file-text',
  attributes: 'fa-tag',
  selected_text: 'fa-quote-left',
  script: 'fa-code',
  workspace: 'fa-briefcase'
};

/**
 * Document type display name to icon mapping
 */
const DOCUMENT_TYPE_ICONS = {
  pdf: 'fa-file-pdf-o',
  word: 'fa-file-word-o',
  excel: 'fa-file-excel-o',
  image: 'fa-file-image-o',
  powerpoint: 'fa-file-powerpoint-o'
};

/**
 * Get icon class for a document based on its typeDisp
 * @param {Object} document - Document object with optional typeDisp
 * @returns {string} FontAwesome icon class
 */
export const getDocumentIcon = (document) => {
  if (!document?.typeDisp) return CONTEXT_TYPE_ICONS.documents;

  const typeDisp = document.typeDisp.toLowerCase();

  if (typeDisp.includes('pdf')) return DOCUMENT_TYPE_ICONS.pdf;
  if (typeDisp.includes('word') || typeDisp.includes('doc')) return DOCUMENT_TYPE_ICONS.word;
  if (typeDisp.includes('excel') || typeDisp.includes('xls') || typeDisp.includes('spreadsheet')) return DOCUMENT_TYPE_ICONS.excel;
  if (typeDisp.includes('image') || typeDisp.includes('png') || typeDisp.includes('jpg') || typeDisp.includes('jpeg')) return DOCUMENT_TYPE_ICONS.image;
  if (typeDisp.includes('powerpoint') || typeDisp.includes('ppt') || typeDisp.includes('presentation')) return DOCUMENT_TYPE_ICONS.powerpoint;

  return CONTEXT_TYPE_ICONS.documents;
};


/**
 * Context tags component showing selected context items
 * @param {Object} props
 * @param {string[]} props.selectedAdditionalContext - Selected context types
 * @param {Object} props.additionalContext - Additional context data (records, documents, attributes)
 * @param {Object} props.selectedTextContext - Selected text context
 * @param {Object} props.scriptContext - Script context data
 * @param {Object} props.workspaceContext - Auto-detected workspace context (not removable)
 * @param {Array} props.uploadedFiles - List of uploaded files
 * @param {Array} props.uploadingFiles - List of files being uploaded
 * @param {Array} props.autoContextArtifacts - Auto-discovered context artifacts
 * @param {Function} props.onToggleContext - Handler to toggle context item
 * @param {Function} props.onRemoveSelectedText - Handler to remove text context
 * @param {Function} props.onRemoveScriptContext - Handler to remove script context
 * @param {Function} props.onRemoveFile - Handler to remove uploaded file
 * @param {Function} props.onRemoveAutoContextArtifact - Handler to remove auto context artifact
 * @param {Function} props.getScriptContextLabel - Function to get script context label
 */
const ChatContextTags = ({
  selectedAdditionalContext = [],
  additionalContext = { records: [], documents: [], attributes: [] },
  selectedTextContext,
  scriptContext,
  workspaceContext,
  uploadedFiles = [],
  uploadingFiles = [],
  autoContextArtifacts = [],
  onToggleContext,
  onRemoveSelectedText,
  onRemoveScriptContext,
  onRemoveUploadedFile,
  onRemoveAutoContextArtifact,
  getScriptContextLabel
}) => {
  const hasContent = selectedAdditionalContext.length > 0 ||
    selectedTextContext ||
    uploadedFiles.length > 0 ||
    uploadingFiles.length > 0 ||
    scriptContext ||
    workspaceContext ||
    autoContextArtifacts.length > 0;

  if (!hasContent) return null;

  return (
    <div className="ai-assistant-chat__context-tags">
      {/* Workspace context (auto-detected, not removable) */}
      {workspaceContext && (
        <div className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--workspace">
          <Icon className="fa fa-briefcase" />
          <span>{workspaceContext.workspaceName || workspaceContext.workspaceId}</span>
          {workspaceContext.artifacts && (() => {
            const a = workspaceContext.artifacts;
            const total = (a.dataTypes || 0) + (a.forms || 0) + (a.processes || 0) + (a.journals || 0);
            return total > 0 ? <span className="ai-assistant-chat__context-tag-badge">{total}</span> : null;
          })()}
        </div>
      )}

      {/* Selected text context */}
      {selectedTextContext && (
        <div className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--selected-text">
          <Icon className="fa fa-quote-left" />
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
            <Icon className={`fa ${getRecordRefIcon(record.recordRef)}`} />
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
            <Icon className={`fa ${getDocumentIcon(document)}`} />
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
            <Icon className="fa fa-tag" />
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

      {/* Auto-discovered context artifacts */}
      {autoContextArtifacts.map((artifact, index) => (
        <div
          key={`auto-artifact-${artifact.ref}`}
          className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--auto"
          title="Найдено автоматически"
        >
          <Icon className="fa fa-magic" />
          <Icon className={`fa ${getContextArtifactIcon(artifact.type)}`} />
          <span>{getTextByLocale(artifact.displayName) || artifact.ref}</span>
          <button
            className="ai-assistant-chat__context-tag-remove"
            onClick={() => onRemoveAutoContextArtifact?.(artifact.ref)}
            title="Удалить из контекста"
          >
            <Icon className="fa fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChatContextTags;
