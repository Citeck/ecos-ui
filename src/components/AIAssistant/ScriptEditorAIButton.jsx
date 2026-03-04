/**
 * Script Editor AI Button - Universal Version
 *
 * This component wraps the universal AIFieldActions system
 * for use with Ace code editors (scriptContextType fields).
 *
 * Now uses INLINE_DIFF mode for unified UX across all field types.
 *
 * Usage:
 * ```jsx
 * <ScriptEditorAIButton
 *   recordRef={recordRef}
 *   scriptContextType="bpmn-script-task"
 *   getEditorValue={() => editor.getValue()}
 *   setEditorValue={(value) => editor.setValue(value)}
 *   inlineInputContainer={containerElement}
 *   resultContainer={resultContainerElement}
 * />
 * ```
 */

import React, { useCallback } from 'react';

import { AIFieldActions } from './AIQuickActions/components';
import { FIELD_TYPES } from './AIQuickActions/config';
import { CONTENT_TYPES } from './constants';
import { generateScript } from './ScriptAIService';
import editorContextService from './EditorContextService';
import { NotificationManager } from '@/services/notifications';
import { t } from '@/helpers/export/util';

/**
 * ScriptEditorAIButton using Universal AIFieldActions
 * Uses INLINE_DIFF mode for unified UX
 */
const ScriptEditorAIButton = ({
  disabled = false,
  recordRef,
  scriptContextType,
  ecosType,
  processRef,
  formContext = null,
  fieldInfo = null,
  getEditorValue,
  setEditorValue,
  inlineInputContainer,
  resultContainer,
  language = 'javascript',
  popperClassName,
  positionVariant,
  onRegisterClose
}) => {
  /**
   * Get resolved context data
   */
  const getResolvedContext = useCallback(() => {
    const contextData = editorContextService.getContextData() || {};
    return {
      ecosType: ecosType || contextData.ecosType || '',
      processRef: processRef || contextData.processRef || ''
    };
  }, [ecosType, processRef]);

  /**
   * Handle AI generation request from AIFieldActions
   * This is called when user triggers generation via quick action or prompt
   */
  const handleGenerateRequest = useCallback(async ({
    prompt,
    quickActionId,
    currentValue,
    conversationId,
    onRequestId
  }) => {
    const { ecosType: resolvedEcosType, processRef: resolvedProcessRef } = getResolvedContext();

    // Serialize form context to JSON string for backend
    let metadata;
    if (formContext) {
      try {
        metadata = JSON.stringify(formContext);
      } catch (error) {
        console.error('[ScriptEditorAIButton] Failed to serialize formContext:', error);
        NotificationManager.error(
          t('ai-actions.error.form-context'),
          t('ai-actions.error.title', 'Error')
        );
        return { generatedValue: '', explanation: '', originalValue: currentValue };
      }
    }

    const result = await generateScript({
      prompt,
      quickAction: quickActionId,
      currentScript: currentValue,
      contextType: scriptContextType,
      recordRef,
      ecosType: resolvedEcosType,
      processRef: resolvedProcessRef,
      metadata: metadata,
      field: fieldInfo,
      conversationId,
      // Pass through onRequestId for cancellation support
      onRequestId,
    });

    // Return unified result format for AIInlineResult with CodeDiffPreview
    return {
      generatedValue: result.modifiedScript,
      explanation: result.explanation,
      originalValue: result.originalScript || currentValue,
      contextType: result.contextType || scriptContextType
    };
  }, [scriptContextType, recordRef, getResolvedContext, formContext, fieldInfo]);

  return (
    <AIFieldActions
      fieldType={FIELD_TYPES.CODE}
      getValue={getEditorValue}
      setValue={setEditorValue}
      recordRef={recordRef}
      contextType={scriptContextType}
      contentType={CONTENT_TYPES.CODE}
      language={language}
      additionalContext={{
        ecosType,
        processRef
      }}
      onGenerateRequest={handleGenerateRequest}
      disabled={disabled}
      actionsBarContainer={inlineInputContainer}
      resultContainer={resultContainer}
      popperClassName={popperClassName}
      positionVariant={positionVariant}
      onRegisterClose={onRegisterClose}
      className="script-editor-ai-button-wrapper"
    />
  );
};

export default ScriptEditorAIButton;
