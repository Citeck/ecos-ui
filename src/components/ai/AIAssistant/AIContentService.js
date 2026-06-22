/**
 * AI Content Service - Unified service for AI-powered content generation
 * Handles all content types: text, code, HTML
 * Provides a single interface while delegating to appropriate backend intents
 */

import uuidV4 from 'uuidv4';

import { getWorkspaceId } from '@/helpers/urls';
import { t } from '@/helpers/export/util';
import { NotificationManager } from '@/services/notifications';
import { AI_INTENTS, MESSAGE_TYPES, API_ENDPOINTS, POLLING_INTERVAL, CONTENT_TYPES } from './constants';

const MAX_POLLING_ATTEMPTS = 120; // 2 minutes max

/**
 * Quick action definitions
 */
export const QUICK_ACTIONS = {
  // Text actions
  GENERATE: 'generate',
  IMPROVE: 'improve',
  EXPAND: 'expand',
  SUMMARIZE: 'summarize',
  FIX_GRAMMAR: 'fix_grammar',
  TRANSLATE: 'translate',
  SIMPLIFY: 'simplify',
  FORMALIZE: 'formalize',
  // Code actions
  EXPLAIN: 'explain',
  FIX: 'fix',
  OPTIMIZE: 'optimize',
  ADD_COMMENTS: 'add_comments',
  DOCUMENT: 'document'
};

/**
 * Context types for different content
 */
export const CONTEXT_TYPES = {
  // Text context types
  DOCUMENTATION: 'documentation',
  DESCRIPTION: 'description',
  NAME: 'name',
  COMMENT: 'comment',
  GENERAL: 'general',
  // Code context types - these come from backend
  BPMN_SCRIPT_TASK: 'bpmn_script_task',
};

/**
 * Unified content generation result
 * @typedef {Object} ContentGenerationResult
 * @property {string} original - Original content
 * @property {string} generated - Generated/modified content
 * @property {string} explanation - Explanation of changes (if any)
 * @property {string} contentType - Content type (text, code, html)
 * @property {string} [contextType] - Context type for scripts
 */

/**
 * Generate or modify content using AI
 * @param {Object} params - Generation parameters
 * @param {string} [params.prompt] - User's request/instruction
 * @param {string} [params.quickAction] - Quick action ID
 * @param {string} params.currentContent - Current content (can be empty for generation)
 * @param {string} params.contentType - Content type: text, code, or html
 * @param {string} [params.contextType] - Context type for field/script
 * @param {string} [params.fieldLabel] - Field label for context (text)
 * @param {string} [params.recordRef] - Record reference
 * @param {string} [params.language] - Programming language (code)
 * @param {string} [params.ecosType] - ECOS type reference (code)
 * @param {string} [params.processRef] - BPMN process reference (code)
 * @param {string} [params.conversationId] - Conversation ID for multi-turn
 * @param {Function} [params.onProgress] - Progress callback
 * @returns {Promise<ContentGenerationResult>}
 */
export const generateContent = async ({
  prompt,
  quickAction,
  currentContent,
  contentType,
  contextType,
  fieldLabel,
  recordRef,
  language,
  ecosType,
  processRef,
  conversationId,
  onProgress
}) => {
  // Determine the appropriate intent based on content type
  const isCodeContent = contentType === CONTENT_TYPES.CODE;
  const intent = isCodeContent ? AI_INTENTS.SCRIPT_WRITING : AI_INTENTS.TEXT_EDITING;

  // Build request data based on content type
  const requestData = isCodeContent
    ? buildCodeRequest({ prompt, quickAction, currentContent, contextType, recordRef, ecosType, processRef, conversationId })
    : buildTextRequest({ prompt, quickAction, currentContent, contextType, fieldLabel, recordRef, conversationId });

  // Send initial request
  let response;
  try {
    response = await fetch(API_ENDPOINTS.UNIVERSAL_ASYNC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
  } catch (networkError) {
    const errorMessage = t('ai-content-service.network-error', 'Network error. Please check your connection and try again.');
    NotificationManager.error(errorMessage, t('ai-content-service.error-title', 'AI Assistant Error'));
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const errorMessage = t('ai-content-service.request-failed', { status: response.status, details: errorText });
    NotificationManager.error(errorMessage, t('ai-content-service.error-title', 'AI Assistant Error'));
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  const requestId = data.requestId;

  if (!requestId) {
    const errorMessage = t('ai-content-service.no-request-id', 'Failed to get request ID from server');
    NotificationManager.error(errorMessage, t('ai-content-service.error-title', 'AI Assistant Error'));
    throw new Error('Failed to get request ID');
  }

  // Poll for result with unified response handling
  return pollForResult(requestId, currentContent, contentType, onProgress);
};

/**
 * Build request data for text content
 */
const buildTextRequest = ({ prompt, quickAction, currentContent, contextType, fieldLabel, recordRef, conversationId }) => {
  return {
    message: prompt || '',
    conversationId: conversationId || uuidV4(),
    context: {
      workspace: getWorkspaceId(),
      forceIntent: AI_INTENTS.TEXT_EDITING,
      selection: {
        records: recordRef ? [{ recordRef }] : [],
        attributes: [],
        documents: []
      },
      content: {
        documents: []
      },
      editing: {
        type: 'text',
        quickAction: quickAction || '',
        content: currentContent || '',
        selectedContent: '',
        recordRef: recordRef || '',
        contentType: contextType || CONTENT_TYPES.TEXT,
        fieldType: fieldLabel || ''
      }
    }
  };
};

/**
 * Build request data for code content
 */
const buildCodeRequest = ({ prompt, quickAction, currentContent, contextType, recordRef, ecosType, processRef, conversationId }) => {
  return {
    message: prompt || '',
    conversationId: conversationId || uuidV4(),
    context: {
      workspace: getWorkspaceId(),
      forceIntent: AI_INTENTS.SCRIPT_WRITING,
      selection: {
        records: [],
        attributes: [],
        documents: []
      },
      content: {
        documents: []
      },
      editing: {
        type: 'script',
        quickAction: quickAction || '',
        content: currentContent || '',
        recordRef: recordRef || '',
        contextType: contextType || '',
        ecosType: ecosType || '',
        processRef: processRef || ''
      }
    }
  };
};

/**
 * Poll for content generation result with unified response handling
 * @param {string} requestId - Request ID to poll
 * @param {string} originalContent - Original content for comparison
 * @param {string} contentType - Content type (text, code, html)
 * @param {Function} [onProgress] - Progress callback
 * @returns {Promise<ContentGenerationResult>}
 */
const pollForResult = (requestId, originalContent, contentType, onProgress) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const poll = async () => {
      attempts++;

      if (attempts > MAX_POLLING_ATTEMPTS) {
        const errorMessage = t('ai-content-service.timeout', 'Request timed out. Please try again.');
        NotificationManager.error(errorMessage, t('ai-content-service.error-title', 'AI Assistant Error'));
        reject(new Error('Request timed out'));
        return;
      }

      try {
        let response;
        try {
          response = await fetch(`${API_ENDPOINTS.UNIVERSAL_STATUS}/${requestId}`);
        } catch (networkError) {
          const errorMessage = t('ai-content-service.network-error', 'Network error. Please check your connection and try again.');
          NotificationManager.error(errorMessage, t('ai-content-service.error-title', 'AI Assistant Error'));
          reject(new Error(errorMessage));
          return;
        }

        if (!response.ok) {
          const errorMessage = t('ai-content-service.polling-failed', { status: response.status });
          NotificationManager.error(errorMessage, t('ai-content-service.error-title', 'AI Assistant Error'));
          reject(new Error(`Polling failed: ${response.status}`));
          return;
        }

        const data = await response.json();

        if (data.result) {
          const result = parseResult(data.result, originalContent, contentType);
          if (result.error) {
            NotificationManager.error(result.error, t('ai-content-service.error-title', 'AI Assistant Error'));
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
          return;
        }

        if (data.error) {
          const errorMessage = data.error || t('ai-content-service.unknown-error', 'Unknown error occurred');
          NotificationManager.error(errorMessage, t('ai-content-service.error-title', 'AI Assistant Error'));
          reject(new Error(errorMessage));
          return;
        }

        if (data.status === 'cancelled') {
          reject(new Error('Request was cancelled'));
          return;
        }

        if (data.status === 'processing' || data.status === 'pending') {
          if (onProgress && data.progress) {
            onProgress({
              stage: data.progress.stage,
              progress: data.progress.progress,
              message: data.progress.message
            });
          }
          setTimeout(poll, POLLING_INTERVAL);
          return;
        }

        // Unknown status - log warning and continue polling
        console.warn('AI Content Service: Unknown polling status:', data.status, 'Attempt:', attempts);
        setTimeout(poll, POLLING_INTERVAL);
      } catch (error) {
        const errorMessage = error.message || t('ai-content-service.unknown-error', 'Unknown error occurred');
        NotificationManager.error(errorMessage, t('ai-content-service.error-title', 'AI Assistant Error'));
        reject(error);
      }
    };

    poll();
  });
};

/**
 * Parse result from API response into unified format
 * @param {Object} responseData - Raw response data
 * @param {string} originalContent - Original content
 * @param {string} contentType - Content type
 * @returns {ContentGenerationResult}
 */
const parseResult = (responseData, originalContent, contentType) => {
  const message = responseData.message;

  // Script writing response
  if (typeof message === 'object' && message?.type === MESSAGE_TYPES.SCRIPT_WRITING) {
    return {
      original: message.originalScript || originalContent || '',
      generated: message.modifiedScript || '',
      explanation: message.explanation || '',
      contentType: CONTENT_TYPES.CODE,
      contextType: message.contextType || ''
    };
  }

  // Text editing response
  if (typeof message === 'object' && message?.type === MESSAGE_TYPES.TEXT_EDITING) {
    const generatedText = message.generatedText || message.modifiedText || message.text || '';

    // If no text was generated but there's a description - it's an informational message
    if (!generatedText && message.description) {
      return { error: message.description };
    }

    return {
      original: originalContent || '',
      generated: generatedText,
      explanation: message.explanation || message.description || '',
      contentType: contentType || CONTENT_TYPES.TEXT
    };
  }

  // Plain text response
  if (typeof message === 'string') {
    return {
      original: originalContent || '',
      generated: message,
      explanation: '',
      contentType: contentType || CONTENT_TYPES.TEXT
    };
  }

  // Generic text response
  if (message?.text) {
    return {
      original: originalContent || '',
      generated: message.text,
      explanation: message.explanation || '',
      contentType: contentType || CONTENT_TYPES.TEXT
    };
  }

  // Try to extract text from response
  const text = extractTextFromResponse(responseData);
  if (text) {
    return {
      original: originalContent || '',
      generated: text,
      explanation: '',
      contentType: contentType || CONTENT_TYPES.TEXT
    };
  }

  return { error: 'Unexpected response type from AI' };
};

/**
 * Try to extract text from various response formats
 */
const extractTextFromResponse = (responseData) => {
  if (!responseData) return null;
  if (typeof responseData === 'string') return responseData;
  if (responseData.message?.text) return responseData.message.text;
  if (responseData.message?.generatedText) return responseData.message.generatedText;
  if (responseData.message?.modifiedText) return responseData.message.modifiedText;
  if (responseData.message?.content) return responseData.message.content;
  if (typeof responseData.message === 'string') return responseData.message;
  if (responseData.text) return responseData.text;
  if (responseData.content) return responseData.content;
  return null;
};

/**
 * Cancel an active content generation request
 * @param {string} requestId - Request ID to cancel
 * @returns {Promise<boolean>}
 */
export const cancelRequest = async (requestId) => {
  try {
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
  generateContent,
  cancelRequest,
  QUICK_ACTIONS,
  CONTEXT_TYPES
};
