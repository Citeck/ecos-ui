import classNames from 'classnames';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  ADDITIONAL_CONTEXT_TYPES,
  API_ENDPOINTS,
  getAgentEngine,
  getAgentEngineIcon,
  getAgentEngineLabelKey,
  getContextArtifactIcon,
  getRecordRefIcon
} from '@/components/ai/AIAssistant/constants';
import { applyAgentSwitch } from '@/components/ai/AIAssistant/utils';
import { Icon } from '@/components/common';
import { t } from '@/helpers/export/util';
import { getTextByLocale } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

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
export const getDocumentIcon = document => {
  if (!document?.typeDisp) return CONTEXT_TYPE_ICONS.documents;

  const typeDisp = document.typeDisp.toLowerCase();

  if (typeDisp.includes('pdf')) return DOCUMENT_TYPE_ICONS.pdf;
  if (typeDisp.includes('word') || typeDisp.includes('doc')) return DOCUMENT_TYPE_ICONS.word;
  if (typeDisp.includes('excel') || typeDisp.includes('xls') || typeDisp.includes('spreadsheet')) return DOCUMENT_TYPE_ICONS.excel;
  if (typeDisp.includes('image') || typeDisp.includes('png') || typeDisp.includes('jpg') || typeDisp.includes('jpeg'))
    return DOCUMENT_TYPE_ICONS.image;
  if (typeDisp.includes('powerpoint') || typeDisp.includes('ppt') || typeDisp.includes('presentation'))
    return DOCUMENT_TYPE_ICONS.powerpoint;

  return CONTEXT_TYPE_ICONS.documents;
};

/**
 * How an agent is named on screen, for the dropdown row and the chip alike.
 *
 * Neither may end up blank. `name` is not guaranteed to be a plain string — the list endpoint may
 * return it as an MLText object — and an agent restored from the session storage keeps only what
 * `sanitizeAgent` accepted, which a non-string `name` is not: after a reload such an agent arrives
 * as `{id, engine}` alone. The id is a poor label but an honest one, and it is what the dropdown
 * has always fallen back to; the chip used to render nothing at all.
 * @param {?Object} agent
 * @returns {string}
 */
export const getAgentLabel = agent => getTextByLocale(agent?.name) || agent?.id || '';

/**
 * Agent selector dropdown component
 * @param {Object} props
 * @param {?Object} props.selectedAgent - Currently selected agent, null for the default "Citeck AI"
 * @param {Function} props.onSelectAgent - Applies the new selection
 * @param {Function} props.onClearConversation - Clears the conversation, reporting the outcome as
 *   `Promise<boolean>`; anything but `true` is read as "the conversation is still there", and the
 *   selection is then left untouched — unless there was no dialog to lose (see `applyAgentSwitch`)
 * @param {boolean} props.hasMessages - Whether the chat holds a dialog worth confirming the loss of.
 *   Not the same thing as a non-empty message list: after a reload the list starts empty while the
 *   restored conversation still holds its history server-side, and switching agents deletes it
 *   (`AIAssistantChat` passes `hasRestoredConversation` in as well)
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
        setAgents(Array.isArray(data) ? data : []);
        // Only mark as loaded on success so a transient failure can be retried on the next open.
        setAgentsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  }, [agentsLoaded]);

  useEffect(() => {
    const handleClickOutside = e => {
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

  // Switching agents confirms the loss of the dialog and clears it first, so the chip may only
  // change once the clearing actually happened — see `applyAgentSwitch`, which holds that whole rule
  // for both entry points into an agent switch (this dropdown and the welcome-screen shortcut).
  const switchAgent = agent => {
    setShowDropdown(false);
    applyAgentSwitch({
      agent,
      hasConversation: hasMessages,
      // `null` when there is nothing to lose, as the helper's contract asks: on a chat that has
      // never been used the DELETE is answered 404 — which `runClearConversation` rightly reads as
      // success — and the reset behind it would drop the context staged for the first question
      // (@-records, uploaded files, the editor/script chip) without ever asking. The confirmation
      // inside the helper is skipped on exactly the same `hasMessages`.
      clearConversation: hasMessages ? onClearConversation : null,
      selectAgent: onSelectAgent
      // The clearing is asynchronous and may throw — the callback behind it does more than the
      // DELETE. Unhandled, the rejection would be reported nowhere but the console, with the
      // dropdown already closed over an agent that was never switched.
    }).catch(error => {
      console.error('Error switching agent:', error);
      NotificationManager.error(t('ai-agent.switch-failed'), t('ai-agent.switch-error-title'));
    });
  };

  const handleSelect = agent => {
    if (selectedAgent?.id === agent.id) {
      setShowDropdown(false);
      return;
    }
    switchAgent(agent);
  };

  const handleDeselect = () => {
    if (!selectedAgent) {
      setShowDropdown(false);
      return;
    }
    switchAgent(null);
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
        <Icon className={classNames('fa', selectedAgent ? getAgentEngineIcon(getAgentEngine(selectedAgent)) : 'fa-magic')} />
        <span>{selectedAgent ? getAgentLabel(selectedAgent) : 'Citeck AI'}</span>
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
              <span className="ai-assistant-chat__agent-dropdown-item-header">
                <span className="ai-assistant-chat__agent-dropdown-item-name">Citeck AI</span>
                <span className="ai-assistant-chat__agent-engine-badge ai-assistant-chat__agent-engine-badge--tool_loop">
                  {t('ai-agent.engine.operational')}
                </span>
              </span>
              <span className="ai-assistant-chat__agent-dropdown-item-desc">{t('ai-agent.universal-assistant')}</span>
            </div>
          </div>
          {agents.length > 0 && <div className="ai-assistant-chat__agent-dropdown-divider" />}
          {agents.map(agent => {
            const engine = getAgentEngine(agent);
            return (
              <div
                key={agent.id}
                className={classNames(
                  'ai-assistant-chat__agent-dropdown-item',
                  `ai-assistant-chat__agent-dropdown-item--${engine.toLowerCase()}`,
                  {
                    'ai-assistant-chat__agent-dropdown-item--selected': selectedAgent?.id === agent.id
                  }
                )}
                onClick={() => handleSelect(agent)}
              >
                <Icon className={classNames('fa', getAgentEngineIcon(engine))} />
                <div className="ai-assistant-chat__agent-dropdown-item-text">
                  <span className="ai-assistant-chat__agent-dropdown-item-header">
                    <span className="ai-assistant-chat__agent-dropdown-item-name">{getAgentLabel(agent)}</span>
                    <span
                      className={classNames(
                        'ai-assistant-chat__agent-engine-badge',
                        `ai-assistant-chat__agent-engine-badge--${engine.toLowerCase()}`
                      )}
                    >
                      {t(getAgentEngineLabelKey(engine))}
                    </span>
                  </span>
                  {agent.description && <span className="ai-assistant-chat__agent-dropdown-item-desc">{agent.description}</span>}
                </div>
              </div>
            );
          })}
          {agentsLoaded && agents.length === 0 && <div className="ai-assistant-chat__agent-dropdown-empty">{t('ai-agent.no-agents')}</div>}
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
  const hasContextContent =
    selectedAdditionalContext.length > 0 ||
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
          {workspaceContext.artifacts &&
            (() => {
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
            {t('ai-assistant.context-tag.selected-text-prefix')}&quot;
            {selectedTextContext.text.length > 50 ? selectedTextContext.text.substring(0, 50) + '...' : selectedTextContext.text}&quot;
          </span>
          <button
            className="ai-assistant-chat__context-tag-remove"
            onClick={onRemoveSelectedText}
            title={t('ai-assistant.context-tag.remove-text')}
          >
            <Icon className="fa fa-times" />
          </button>
        </div>
      )}

      {/* Current record context */}
      {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) &&
        additionalContext.records.map((record, index) => (
          <div key={`${ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD}-${index}`} className="ai-assistant-chat__context-tag">
            <Icon className={`fa ${getRecordRefIcon(record.recordRef)}`} />
            <span>{record.displayName || record.recordRef || t('ai-assistant.context-tag.record-fallback')}</span>
            <button
              className="ai-assistant-chat__context-tag-remove"
              onClick={() => onToggleContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, record)}
              title={t('ai-assistant.context-tag.remove')}
            >
              <Icon className="fa fa-times" />
            </button>
          </div>
        ))}

      {/* Documents context */}
      {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) &&
        additionalContext.documents.map((document, index) => (
          <div
            key={`${ADDITIONAL_CONTEXT_TYPES.DOCUMENTS}-${index}`}
            className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--document"
          >
            <Icon className={`fa ${getDocumentIcon(document)}`} />
            <span>{document.displayName || document.recordRef || t('ai-assistant.context-tag.document-fallback')}</span>
            <button
              className="ai-assistant-chat__context-tag-remove"
              onClick={() => onToggleContext(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS, document)}
              title={t('ai-assistant.context-tag.remove-document')}
            >
              <Icon className="fa fa-times" />
            </button>
          </div>
        ))}

      {/* Attributes context */}
      {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES) &&
        additionalContext.attributes.map((attribute, index) => (
          <div
            key={`${ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES}-${index}`}
            className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--attribute"
          >
            <Icon className="fa fa-tag" />
            <span>{t('ai-assistant.context-tag.attribute-prefix') + (attribute.displayName || attribute.attribute)}</span>
            <button
              className="ai-assistant-chat__context-tag-remove"
              onClick={() => onToggleContext(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES, attribute)}
              title={t('ai-assistant.context-tag.remove-attribute')}
            >
              <Icon className="fa fa-times" />
            </button>
          </div>
        ))}

      {/* Script context */}
      {scriptContext && (
        <div className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--script">
          <Icon className="fa fa-code" />
          <span>{getScriptContextLabel ? getScriptContextLabel(scriptContext.scriptContextType) : 'Script'}</span>
          <button
            className="ai-assistant-chat__context-tag-remove"
            onClick={onRemoveScriptContext}
            title={t('ai-assistant.context-tag.remove-script')}
          >
            <Icon className="fa fa-times" />
          </button>
        </div>
      )}

      {/* Uploading files */}
      {uploadingFiles.map(file => (
        <div key={file.id} className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--uploaded-file">
          <Icon className="fa fa-spinner fa-spin" />
          <span>{file.name}</span>
        </div>
      ))}

      {/* Uploaded files */}
      {uploadedFiles.map((file, index) => (
        <div key={`uploaded-file-${index}`} className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--uploaded-file">
          <Icon className="fa fa-file" />
          <span>{file.name}</span>
          <button
            className="ai-assistant-chat__context-tag-remove"
            onClick={() => onRemoveUploadedFile(file)}
            title={t('ai-assistant.context-tag.remove-file')}
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
          title={t('ai-assistant.context-tag.auto-found')}
        >
          <Icon className="fa fa-magic" />
          <Icon className={`fa ${getContextArtifactIcon(artifact.type)}`} />
          <span>{getTextByLocale(artifact.displayName) || artifact.ref}</span>
          <button
            className="ai-assistant-chat__context-tag-remove"
            onClick={() => onRemoveAutoContextArtifact?.(artifact.ref)}
            title={t('ai-assistant.context-tag.remove')}
          >
            <Icon className="fa fa-times" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChatContextTags;
