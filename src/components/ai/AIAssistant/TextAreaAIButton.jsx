/**
 * TextArea AI Button
 * AI Assistant integration for plain textarea fields (documentation, descriptions, etc.)
 *
 * Uses the universal AIFieldActions component with text-specific generation.
 */

import React, { useCallback, useRef } from 'react';
import uuidV4 from 'uuidv4';

import { AIFieldActions } from './AIQuickActions/components';
import { FIELD_TYPES } from './AIQuickActions/config';
import { CONTENT_TYPES } from './constants';
import { generateText, TEXT_QUICK_ACTIONS, TEXT_CONTEXT_TYPES } from './TextAIService';

/**
 * Map field action IDs to TEXT_QUICK_ACTIONS
 */
const mapActionId = actionId => {
  const mapping = {
    improve: TEXT_QUICK_ACTIONS.IMPROVE,
    expand: TEXT_QUICK_ACTIONS.EXPAND,
    summarize: TEXT_QUICK_ACTIONS.SUMMARIZE,
    'fix-grammar': TEXT_QUICK_ACTIONS.FIX_GRAMMAR,
    translate: TEXT_QUICK_ACTIONS.TRANSLATE,
    simplify: TEXT_QUICK_ACTIONS.SIMPLIFY,
    formalize: TEXT_QUICK_ACTIONS.FORMALIZE
  };
  return mapping[actionId] || actionId;
};

/**
 * TextAreaAIButton Component
 *
 * @param {Object} props
 * @param {boolean} [props.disabled] - Whether the button is disabled
 * @param {string} [props.recordRef] - Record reference for context
 * @param {string} [props.fieldType] - Field type (textarea, documentation, name)
 * @param {string} [props.fieldLabel] - Field label for context
 * @param {string} [props.contextType] - Semantic context type for the quick-actions UI (e.g. 'description'); NOT sent as content format
 * @param {string} [props.contentType] - Content format sent to the backend ('text' | 'html' | 'code'); defaults to plain text
 * @param {Object} [props.fieldInfo] - Field information for AI context {id, name, type}
 * @param {Function} props.getValue - Function to get current textarea value
 * @param {Function} props.setValue - Function to set textarea value
 * @param {HTMLElement} [props.actionsBarContainer] - Container for actions bar (portal)
 * @param {HTMLElement} [props.resultContainer] - Container for result display (portal)
 * @param {HTMLElement} [props.fieldElement] - The field itself; AI popups may not leave its bounds
 */
const TextAreaAIButton = ({
  disabled = false,
  recordRef = '',
  fieldType = FIELD_TYPES.TEXTAREA,
  fieldLabel = '',
  contextType = TEXT_CONTEXT_TYPES.GENERAL,
  contentType = CONTENT_TYPES.TEXT,
  fieldInfo = null,
  getValue,
  setValue,
  actionsBarContainer,
  resultContainer,
  fieldElement
}) => {
  // Conversation ID for multi-turn interactions
  const conversationIdRef = useRef(uuidV4());

  /**
   * Handle AI generation request
   * This is called by AIFieldActions when user triggers generation
   */
  const handleGenerateRequest = useCallback(
    async ({ prompt, quickActionId, currentValue }) => {
      const mappedAction = quickActionId ? mapActionId(quickActionId) : null;

      const response = await generateText({
        prompt,
        quickAction: mappedAction,
        currentText: currentValue,
        // Content FORMAT (text/html/code) — not the field's semantic context type.
        // Sending contextType here (e.g. 'description') was a contract drift that broke
        // backend TextEditingContext parsing (COREDEV-323); the semantic contextType is
        // only used for the quick-actions UI below.
        contentType,
        fieldType,
        recordRef,
        field: fieldInfo,
        conversationId: conversationIdRef.current
      });

      return {
        generatedValue: response.generatedText,
        explanation: response.explanation
      };
    },
    [contentType, fieldType, recordRef, fieldInfo]
  );

  return (
    <AIFieldActions
      fieldType={fieldType}
      getValue={getValue}
      setValue={setValue}
      recordRef={recordRef}
      contextType={contextType}
      additionalContext={{ fieldLabel }}
      onGenerateRequest={handleGenerateRequest}
      disabled={disabled}
      actionsBarContainer={actionsBarContainer}
      resultContainer={resultContainer}
      fieldElement={fieldElement}
      className="textarea-ai-button-wrapper"
    />
  );
};

export default TextAreaAIButton;
