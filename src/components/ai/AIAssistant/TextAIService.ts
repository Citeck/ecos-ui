/**
 * Text AI Service - Dedicated service for AI-powered text generation/editing
 * Handles API requests and polling for text editing operations (textarea fields)
 */

// @ts-ignore - uuidv4 doesn't have types
import uuidV4 from 'uuidv4';

import { buildRequestError } from './aiRequestError';
import { extractAnswerText } from './assistantResponse';
import { pollAiRequest, stopAiRequestPolling } from './aiRequestPolling';
import { AI_INTENTS, MESSAGE_TYPES, API_ENDPOINTS, CONTENT_TYPES } from './constants';
import { ATTRIBUTE_TYPES, FIELD_TYPE_VALUES, type AttributeType, type FieldTypeValue, type FieldInfo, type ProgressInfo } from './types';

import { getWorkspaceId } from '@/helpers/urls';

// Re-export types for consumers
export { ATTRIBUTE_TYPES, FIELD_TYPE_VALUES };
export type { AttributeType, FieldTypeValue, FieldInfo, ProgressInfo };

/** Record data for selection context */
export interface SelectionRecord {
  recordRef: string;
  displayName: string;
  type: string;
}

// Track active polling timeouts for cleanup

/**
 * Quick action definitions for text fields
 */
export const TEXT_QUICK_ACTIONS = {
  IMPROVE: 'improve',
  EXPAND: 'expand',
  SUMMARIZE: 'summarize',
  // Hyphen matches the backend's canonical quick-action key (TextQuickActionsProvider). The backend
  // also normalizes '_'→'-', but the FE should send the canonical id directly (COREDEV-323 FE align).
  FIX_GRAMMAR: 'fix-grammar',
  TRANSLATE: 'translate',
  SIMPLIFY: 'simplify',
  FORMALIZE: 'formalize'
} as const;

export type TextQuickAction = (typeof TEXT_QUICK_ACTIONS)[keyof typeof TEXT_QUICK_ACTIONS];

/**
 * Context types for different text fields
 */
export const TEXT_CONTEXT_TYPES = {
  DOCUMENTATION: 'documentation',
  DESCRIPTION: 'description',
  NAME: 'name',
  COMMENT: 'comment',
  GENERAL: 'general'
} as const;

export type TextContextType = (typeof TEXT_CONTEXT_TYPES)[keyof typeof TEXT_CONTEXT_TYPES];

/**
 * Parameters for generateText function
 */
export interface GenerateTextParams {
  /** User's request/instruction (additional instructions, NOT quickAction) */
  prompt?: string;
  /** Quick action ID (e.g., 'improve', 'expand', 'summarize') */
  quickAction?: string;
  /** Current text content (can be empty for generation) */
  currentText: string;
  /** Selected text for context (AI will focus on editing this part) */
  selectedText?: string;
  /** Content type (e.g., 'text', 'html', 'richtext') */
  contentType?: string;
  /** Field type for context (e.g., 'textarea', 'richtext') */
  fieldType?: string;
  /** Record reference for editing context (the object being edited) */
  recordRef?: string;
  /** Page record data for selection context (the current page/card with full info) */
  pageRecord?: SelectionRecord;
  /** Field information for AI context */
  field?: FieldInfo;
  /** Optional conversation ID for multi-turn */
  conversationId?: string;
  /** Optional progress callback */
  onProgress?: (info: ProgressInfo) => void;
  /** Optional callback to receive requestId immediately for cancellation support */
  onRequestId?: (requestId: string) => void;
}

/**
 * Result from generateText function
 */
export interface GenerateTextResult {
  originalText: string;
  generatedText: string;
  explanation: string;
}

interface TextEditingMessage {
  type: string;
  generatedText?: string;
  modifiedText?: string;
  text?: string;
  explanation?: string;
  description?: string;
}

interface ResponseData {
  message?: TextEditingMessage | string;
  text?: string;
  content?: string;
}

interface PollResponse {
  result?: {
    message?: TextEditingMessage | string;
  };
  error?: string;
  status?: string;
  progress?: ProgressInfo;
}

/**
 * Generate or modify text using AI
 */
export const generateText = async ({
  prompt,
  quickAction,
  currentText,
  selectedText,
  contentType,
  fieldType,
  recordRef,
  pageRecord,
  field,
  conversationId,
  onProgress,
  onRequestId
}: GenerateTextParams): Promise<GenerateTextResult> => {
  const requestData = {
    message: prompt || '',
    conversationId: conversationId || uuidV4(),
    context: {
      workspace: getWorkspaceId(),
      forceIntent: AI_INTENTS.TEXT_EDITING,
      selection: {
        // This should be the page/card being viewed, not the object being edited
        records: pageRecord ? [pageRecord] : [],
        attributes: [],
        documents: []
      },
      content: {
        documents: []
      },
      editing: {
        type: 'text',
        quickAction: quickAction || '',
        content: currentText || '',
        selectedContent: selectedText || '',
        recordRef: recordRef || '',
        contentType: contentType || CONTENT_TYPES.TEXT,
        fieldType: fieldType || '',
        field: field || null
      }
    }
  };

  // Send initial request
  const response = await fetch(API_ENDPOINTS.UNIVERSAL_ASYNC, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    // Carries the server's own reason when it gave one, so the panel can show it instead of
    // closing over a bare status code (D-G-400-SILENT).
    throw await buildRequestError(response);
  }

  const data = await response.json();
  const requestId = data.requestId;

  if (!requestId) {
    throw new Error('Failed to get request ID');
  }

  // Notify caller about requestId immediately (for cancellation support)
  if (onRequestId) {
    onRequestId(requestId);
  }

  // Poll for result
  return pollForResult(requestId, requestId, currentText, onProgress);
};

/**
 * Poll for text generation result. The clock, ramp, budget and cancel-on-give-up live in
 * `pollAiRequest`; only the reading of the answer is this service's own.
 */
const pollForResult = async (
  requestId: string,
  trackingId: string,
  originalText: string,
  onProgress?: (info: ProgressInfo) => void
): Promise<GenerateTextResult> => {
  let data: PollResponse;
  try {
    data = await pollAiRequest({
      requestId,
      trackingId,
      statusUrl: API_ENDPOINTS.UNIVERSAL_STATUS,
      onProgress: (progress: ProgressInfo) =>
        onProgress?.({
          stage: progress.stage,
          progress: progress.progress,
          message: progress.message
        }),
      // The request is still running server-side, and nobody is going to collect its answer now —
      // so it is called off rather than left to burn tokens on a result no one will read.
      onGiveUp: () => void cancelRequest(requestId)
    });
  } catch (error) {
    const httpStatus = (error as Error & { httpStatus?: number }).httpStatus;
    throw httpStatus ? new Error(`Polling failed: ${httpStatus}`) : error;
  }

  if (data.result) {
    const responseData = data.result;

    // Check if result is a text editing response
    const isTextEditingMessage = typeof responseData.message === 'object' && responseData.message?.type === MESSAGE_TYPES.TEXT_EDITING;

    if (isTextEditingMessage) {
      const msg = responseData.message as TextEditingMessage;
      const generatedText = msg.generatedText || msg.modifiedText || msg.text || '';

      // If no text was generated but there's a description - it's an informational message
      if (!generatedText && msg.description) {
        throw new Error(msg.description);
      }

      return {
        originalText: originalText || '',
        generatedText: generatedText,
        explanation: msg.explanation || msg.description || ''
      };
    }

    if (typeof responseData.message === 'string') {
      // Plain text response
      return {
        originalText: originalText || '',
        generatedText: responseData.message,
        explanation: ''
      };
    }

    if ((responseData.message as TextEditingMessage)?.text) {
      // Generic text response
      const msg = responseData.message as TextEditingMessage;
      return {
        originalText: originalText || '',
        generatedText: msg.text || '',
        explanation: msg.explanation || ''
      };
    }

    // Try to extract text from response
    const text = extractAnswerText(responseData);
    if (text) {
      return {
        originalText: originalText || '',
        generatedText: text,
        explanation: ''
      };
    }
    throw new Error('Unexpected response type from AI');
  }

  if (data.error) {
    throw new Error(data.error || 'Unknown error occurred');
  }

  // The only terminal body left is a cancellation.
  throw new Error('Request was cancelled');
};

/**
 * Cancel an active text generation request
 */
export const cancelRequest = async (requestId: string): Promise<boolean> => {
  try {
    // Stop the poll of this request before telling the server, so no further status GET goes out
    stopAiRequestPolling(requestId);

    const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_STATUS}/${requestId}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('Error cancelling request:', error);
    return false;
  }
};

export default {
  generateText,
  cancelRequest,
  TEXT_QUICK_ACTIONS,
  TEXT_CONTEXT_TYPES,
  ATTRIBUTE_TYPES,
  FIELD_TYPE_VALUES
};
