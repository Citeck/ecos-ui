/**
 * Text AI Service - Dedicated service for AI-powered text generation/editing
 * Handles API requests and polling for text editing operations (textarea fields)
 */

// @ts-ignore - uuidv4 doesn't have types
import uuidV4 from 'uuidv4';

import { getWorkspaceId } from '@/helpers/urls';
import { AI_INTENTS, MESSAGE_TYPES, API_ENDPOINTS, POLLING_INTERVAL, CONTENT_TYPES } from "./constants";
import {
  ATTRIBUTE_TYPES,
  FIELD_TYPE_VALUES,
  type AttributeType,
  type FieldTypeValue,
  type FieldInfo,
  type ProgressInfo
} from './types';

// Re-export types for consumers
export { ATTRIBUTE_TYPES, FIELD_TYPE_VALUES };
export type { AttributeType, FieldTypeValue, FieldInfo, ProgressInfo };

/** Record data for selection context */
export interface SelectionRecord {
  recordRef: string;
  displayName: string;
  type: string;
}

const MAX_POLLING_ATTEMPTS = 120; // 2 minutes max

// Track active polling timeouts for cleanup
const activePollingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Quick action definitions for text fields
 */
export const TEXT_QUICK_ACTIONS = {
  IMPROVE: 'improve',
  EXPAND: 'expand',
  SUMMARIZE: 'summarize',
  FIX_GRAMMAR: 'fix_grammar',
  TRANSLATE: 'translate',
  SIMPLIFY: 'simplify',
  FORMALIZE: 'formalize'
} as const;

export type TextQuickAction = typeof TEXT_QUICK_ACTIONS[keyof typeof TEXT_QUICK_ACTIONS];

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

export type TextContextType = typeof TEXT_CONTEXT_TYPES[keyof typeof TEXT_CONTEXT_TYPES];

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
    throw new Error(`Request failed: ${response.status}`);
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
 * Poll for text generation result
 */
const pollForResult = (
  requestId: string,
  trackingId: string,
  originalText: string,
  onProgress?: (info: ProgressInfo) => void
): Promise<GenerateTextResult> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const cleanup = () => {
      activePollingTimeouts.delete(trackingId);
    };

    const poll = async () => {
      attempts++;

      if (attempts > MAX_POLLING_ATTEMPTS) {
        cleanup();
        reject(new Error('Request timed out'));
        return;
      }

      try {
        const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_STATUS}/${requestId}`);

        if (!response.ok) {
          cleanup();
          throw new Error(`Polling failed: ${response.status}`);
        }

        const data: PollResponse = await response.json();

        if (data.result) {
          cleanup();
          const responseData = data.result;

          // Check if result is a text editing response
          const isTextEditingMessage =
            typeof responseData.message === 'object' &&
            responseData.message?.type === MESSAGE_TYPES.TEXT_EDITING;

          if (isTextEditingMessage) {
            const msg = responseData.message as TextEditingMessage;
            const generatedText = msg.generatedText || msg.modifiedText || msg.text || '';

            // If no text was generated but there's a description - it's an informational message
            if (!generatedText && msg.description) {
              reject(new Error(msg.description));
              return;
            }

            resolve({
              originalText: originalText || '',
              generatedText: generatedText,
              explanation: msg.explanation || msg.description || ''
            });
          } else if (typeof responseData.message === 'string') {
            // Plain text response
            resolve({
              originalText: originalText || '',
              generatedText: responseData.message,
              explanation: ''
            });
          } else if ((responseData.message as TextEditingMessage)?.text) {
            // Generic text response
            const msg = responseData.message as TextEditingMessage;
            resolve({
              originalText: originalText || '',
              generatedText: msg.text || '',
              explanation: msg.explanation || ''
            });
          } else {
            // Try to extract text from response
            const text = extractTextFromResponse(responseData as ResponseData);
            if (text) {
              resolve({
                originalText: originalText || '',
                generatedText: text,
                explanation: ''
              });
            } else {
              reject(new Error('Unexpected response type from AI'));
            }
          }
          return;
        }

        if (data.error) {
          cleanup();
          reject(new Error(data.error || 'Unknown error occurred'));
          return;
        }

        if (data.status === 'cancelled') {
          cleanup();
          reject(new Error('Request was cancelled'));
          return;
        }

        if (data.status === 'processing') {
          // Report progress if callback provided
          if (onProgress && data.progress) {
            onProgress({
              stage: data.progress.stage,
              progress: data.progress.progress,
              message: data.progress.message
            });
          }

          // Continue polling - track timeout for cleanup
          const timeoutId = setTimeout(poll, POLLING_INTERVAL);
          activePollingTimeouts.set(trackingId, timeoutId);
          return;
        }

        // Unknown status, continue polling - track timeout for cleanup
        const timeoutId = setTimeout(poll, POLLING_INTERVAL);
        activePollingTimeouts.set(trackingId, timeoutId);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    // Start polling
    poll();
  });
};

/**
 * Try to extract text from various response formats
 */
const extractTextFromResponse = (responseData: ResponseData): string | null => {
  if (!responseData) return null;

  // Direct text
  if (typeof responseData === 'string') return responseData;

  // message.text
  if (typeof responseData.message === 'object' && responseData.message?.text) {
    return responseData.message.text;
  }

  // message.generatedText
  if (typeof responseData.message === 'object' && responseData.message?.generatedText) {
    return responseData.message.generatedText;
  }

  // message.modifiedText
  if (typeof responseData.message === 'object' && responseData.message?.modifiedText) {
    return responseData.message.modifiedText;
  }

  // Direct message string
  if (typeof responseData.message === 'string') return responseData.message;

  // text field
  if (responseData.text) return responseData.text;

  // content field
  if (responseData.content) return responseData.content;

  return null;
};

/**
 * Cancel an active text generation request
 */
export const cancelRequest = async (requestId: string): Promise<boolean> => {
  try {
    // Clear any active polling timeout for this request
    const timeoutId = activePollingTimeouts.get(requestId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      activePollingTimeouts.delete(requestId);
    }

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
