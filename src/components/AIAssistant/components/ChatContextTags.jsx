import React, { useState, useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { Icon } from '../../common';
import { ADDITIONAL_CONTEXT_TYPES, API_ENDPOINTS, getContextArtifactIcon, getRecordRefIcon } from '../constants';
import { getTextByLocale } from '../../../helpers/util';
import { t } from '@/helpers/export/util';

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
 * Agent selector dropdown component
 */
const AgentSelector = ({ selectedAgent, onSelectAgent, onClearConversation, hasMessages }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const dropdownRef = useRef(null);

  const loadAgents = useCallback(async () => {
    if (agentsLoaded) return;
    try {
      const response = await fetch(API_ENDPOINTS.AGENT_LIST);
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
    setAgentsLoaded(true);
  }, [agentsLoaded]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleToggle = () => {
    if (!showDropdown) loadAgents();
    setShowDropdown(!showDropdown);
  };

  const confirmSwitch = () => {
    return !hasMessages || window.confirm(t('ai-agent.confirm-switch'));
  };

  const handleSelect = (agent) => {
    if (selectedAgent?.id === agent.id) {
      setShowDropdown(false);
      return;
    }
    if (!confirmSwitch()) return;
    onClearConversation?.();
    onSelectAgent?.(agent);
    setShowDropdown(false);
  };

  const handleDeselect = () => {
    if (!selectedAgent) {
      setShowDropdown(false);
      return;
    }
    if (!confirmSwitch()) return;
    onClearConversation?.();
    onSelectAgent?.(null);
    setShowDropdown(false);
  };

  return (
    <div className="ai-assistant-chat__agent-selector-inline" ref={dropdownRef}>
      <button
        type="button"
        className={classNames('ai-assistant-chat__context-tag', 'ai-assistant-chat__context-tag--agent', {
          'ai-assistant-chat__context-tag--agent-active': !!selectedAgent
        })}
        onClick={handleToggle}
      >
        <Icon className={classNames('fa', selectedAgent ? 'fa-robot' : 'fa-magic')} />
        <span>{selectedAgent ? selectedAgent.name : 'Citeck AI'}</span>
        <Icon className="fa fa-caret-down" />
      </button>
      {showDropdown && (
        <div className="ai-assistant-chat__agent-dropdown">
          <div
            className={classNames('ai-assistant-chat__agent-dropdown-item', {
              'ai-assistant-chat__agent-dropdown-item--selected': !selectedAgent
            })}
            onClick={handleDeselect}
          >
            <Icon className="fa fa-magic" />
            <div className="ai-assistant-chat__agent-dropdown-item-text">
              <span className="ai-assistant-chat__agent-dropdown-item-name">Citeck AI</span>
              <span className="ai-assistant-chat__agent-dropdown-item-desc">{t('ai-agent.universal-assistant')}</span>
            </div>
          </div>
          {agents.length > 0 && <div className="ai-assistant-chat__agent-dropdown-divider" />}
          {agents.map(agent => (
            <div
              key={agent.id}
              className={classNames('ai-assistant-chat__agent-dropdown-item', {
                'ai-assistant-chat__agent-dropdown-item--selected': selectedAgent?.id === agent.id
              })}
              onClick={() => handleSelect(agent)}
            >
              <Icon className="fa fa-robot" />
              <div className="ai-assistant-chat__agent-dropdown-item-text">
                <span className="ai-assistant-chat__agent-dropdown-item-name">{agent.name || agent.id}</span>
                {agent.description && (
                  <span className="ai-assistant-chat__agent-dropdown-item-desc">{agent.description}</span>
                )}
              </div>
            </div>
          ))}
          {agentsLoaded && agents.length === 0 && (
            <div className="ai-assistant-chat__agent-dropdown-empty">{t('ai-agent.no-agents')}</div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Context tags component showing selected context items and agent selector
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
  selectedAgent,
  onSelectAgent,
  onClearConversation,
  hasMessages,
  onToggleContext,
  onRemoveSelectedText,
  onRemoveScriptContext,
  onRemoveUploadedFile,
  onRemoveAutoContextArtifact,
  getScriptContextLabel
}) => {
  // Agent selector is always visible
  const hasContextContent = selectedAdditionalContext.length > 0 ||
    selectedTextContext ||
    uploadedFiles.length > 0 ||
    uploadingFiles.length > 0 ||
    scriptContext ||
    workspaceContext ||
    autoContextArtifacts.length > 0;

  return (
    <div className="ai-assistant-chat__context-tags">
      {/* Agent selector (always visible) */}
      <AgentSelector
        selectedAgent={selectedAgent}
        onSelectAgent={onSelectAgent}
        onClearConversation={onClearConversation}
        hasMessages={hasMessages}
      />

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
