/**
 * Hook for AI text generation in Lexical editor
 * Centralizes the logic for preparing context and calling generateText
 */

import { useCallback, useRef, useEffect } from 'react';

import additionalContextService from '@/components/ai/AIAssistant/AdditionalContextService';
import { FIELD_TYPES } from '@/components/ai/AIAssistant/AIQuickActions';
import { CONTENT_TYPES } from '@/components/ai/AIAssistant/constants';
import { generateText } from '@/components/ai/AIAssistant/TextAIService';
import { type FieldInfo, ATTRIBUTE_TYPES } from '@/components/ai/AIAssistant/types';

export interface GenerateRequestParams {
  prompt?: string;
  quickActionId?: string;
  currentValue: string;
}

export interface GenerateRequestResult {
  generatedValue: string;
  explanation: string;
  originalValue: string;
}

export interface LexicalAIContext {
  /** Record reference of the object being edited (e.g., comment recordRef) */
  recordRef: string;
  /** Attribute name being edited (defaults to 'text') */
  attribute?: string;
  /**
   * Human-readable label of the field being edited, as it is written on the form.
   *
   * D-G-LEXICAL-FIELDNAME (regr-20260816-r1, G3/G7): without it `field.name` carried the attribute
   * id — `{"id":"richNotes","name":"richNotes"}` where the plain textarea path sends
   * `{"id":"notes","name":"Заметка"}` — and the backend uses `field.name` as the human-readable
   * name, so the raw id could surface in text written for the user.
   */
  attributeLabel?: string;
  /** Selected text within the editor (for partial editing) */
  selectedText?: string;
  /** Conversation ID for multi-turn interactions */
  conversationId: string;
}

export type GenerateRequestHandler = (params: GenerateRequestParams) => Promise<GenerateRequestResult>;

/**
 * Core function for AI text generation - can be used directly or via hook
 */
export async function lexicalAIGenerateRequest(
  context: LexicalAIContext,
  params: GenerateRequestParams
): Promise<GenerateRequestResult> {
  const { recordRef, attribute, attributeLabel, selectedText, conversationId } = context;
  const { prompt, quickActionId, currentValue } = params;

  // Load current page record with full info (recordRef, displayName, type)
  // This is the card/page being viewed, not the object being edited
  let pageRecord = null;
  try {
    pageRecord = await additionalContextService.loadCurrentRecordData();
  } catch (error) {
    console.warn('Failed to load page record for AI context:', error);
  }

  const attributeId = attribute || 'text';
  const fieldInfo: FieldInfo = {
    id: attributeId,
    // The label when the editor was given one; the id only as a last resort, which is still better
    // than nothing for a field whose form carries no label at all (D-G-LEXICAL-FIELDNAME).
    name: attributeLabel || attributeId,
    type: ATTRIBUTE_TYPES.TEXT
  };

  const result = await generateText({
    prompt,
    quickAction: quickActionId,
    currentText: currentValue,
    selectedText: selectedText || '',
    contentType: CONTENT_TYPES.HTML,
    fieldType: FIELD_TYPES.RICHTEXT,
    recordRef,
    pageRecord: pageRecord || undefined,
    field: fieldInfo,
    conversationId
  });

  return {
    generatedValue: result.generatedText,
    explanation: result.explanation,
    originalValue: result.originalText || currentValue
  };
}

/**
 * Hook for components with stable props (like AIAssistantButton)
 * Returns a memoized handler function
 * Uses ref pattern to avoid stale closures when context changes
 */
export function useLexicalAIGenerate(context: LexicalAIContext): GenerateRequestHandler {
  const contextRef = useRef(context);

  // Update ref on every render so we always have latest values
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  // Stable callback that reads current ref value at call time
  return useCallback(
    (params: GenerateRequestParams) => lexicalAIGenerateRequest(contextRef.current, params),
    []
  );
}

/**
 * Hook for components with dynamic context stored in refs (like AIFloatingPopup)
 * Returns a handler that reads current context from refs at call time
 */
export function useLexicalAIGenerateWithRefs(): {
  contextRef: { current: LexicalAIContext };
  handleGenerateRequest: GenerateRequestHandler;
} {
  const contextRef = useRef<LexicalAIContext>({
    recordRef: '',
    attribute: '',
    selectedText: '',
    conversationId: ''
  });

  const handleGenerateRequest = useCallback(
    (params: GenerateRequestParams) => lexicalAIGenerateRequest(contextRef.current, params),
    []
  );

  return { contextRef, handleGenerateRequest };
}
