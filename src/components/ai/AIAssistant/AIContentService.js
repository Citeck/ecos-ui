/**
 * AI Content Service - Unified service for AI-powered content generation
 * Handles all content types: text, code, HTML
 * Provides a single interface while delegating to appropriate backend intents
 */

import uuidV4 from 'uuidv4';

import { buildRequestError } from './aiRequestError';
import { extractAnswerText } from './assistantResponse';
import { pollAiRequest, stopAiRequestPolling } from './aiRequestPolling';
import { AI_INTENTS, MESSAGE_TYPES, API_ENDPOINTS, CONTENT_TYPES, PLATFORM_CONFIG_AGENT_REF } from './constants';

import { t } from '@/helpers/export/util';
import { getWorkspaceId } from '@/helpers/urls';
import { NotificationManager } from '@/services/notifications';

/**
 * Quick action definitions
 */
export const QUICK_ACTIONS = {
  // Text actions
  GENERATE: 'generate',
  IMPROVE: 'improve',
  EXPAND: 'expand',
  SUMMARIZE: 'summarize',
  // Hyphen matches the backend canonical key (TextQuickActionsProvider); COREDEV-323 FE alignment.
  FIX_GRAMMAR: 'fix-grammar',
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
  BPMN_SCRIPT_TASK: 'bpmn_script_task'
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
    : buildTextRequest({ prompt, quickAction, currentContent, contentType, fieldLabel, recordRef, conversationId });

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
    // Carries the server's own reason when it gave one, so the panel can show it instead of
    // closing over a bare status code (D-G-400-SILENT).
    throw await buildRequestError(response);
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
const buildTextRequest = ({ prompt, quickAction, currentContent, contentType, fieldLabel, recordRef, conversationId }) => {
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
        // Content FORMAT (text/html/code) expected by the backend TextEditingContext — not the
        // field's semantic context type. Sending contextType here ('description', 'documentation', …)
        // was a contract drift that broke parsing (COREDEV-323 FE alignment).
        contentType: contentType || CONTENT_TYPES.TEXT,
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
      // COREDEV-323 FE-M5: script editing routes to the config agent via agentRef
      // (replaces forceIntent=SCRIPT_WRITING); the editScript tool returns the same diff.
      agentRef: PLATFORM_CONFIG_AGENT_REF,
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
const pollForResult = async (requestId, originalContent, contentType, onProgress) => {
  const errorTitle = t('ai-content-service.error-title', 'AI Assistant Error');
  const fail = message => {
    NotificationManager.error(message, errorTitle);
    return new Error(message);
  };

  let data;
  try {
    data = await pollAiRequest({
      requestId,
      statusUrl: API_ENDPOINTS.UNIVERSAL_STATUS,
      onProgress: progress =>
        onProgress?.({
          stage: progress.stage,
          progress: progress.progress,
          message: progress.message
        }),
      // The request is still running server-side, and nobody is going to collect its answer now —
      // so it is called off rather than left to burn tokens on a result no one will read.
      onGiveUp: () => cancelRequest(requestId)
    });
  } catch (error) {
    if (error.isTimeout) {
      NotificationManager.error(t('ai-content-service.timeout', 'Request timed out. Please try again.'), errorTitle);
      throw error;
    }
    if (error.networkError) {
      throw fail(t('ai-content-service.network-error', 'Network error. Please check your connection and try again.'));
    }
    if (error.httpStatus) {
      NotificationManager.error(t('ai-content-service.polling-failed', { status: error.httpStatus }), errorTitle);
      throw new Error(`Polling failed: ${error.httpStatus}`);
    }
    NotificationManager.error(error.message || t('ai-content-service.unknown-error', 'Unknown error occurred'), errorTitle);
    throw error;
  }

  if (data.result) {
    const result = parseResult(data.result, originalContent, contentType);
    if (result.error) {
      throw fail(result.error);
    }
    return result;
  }

  if (data.error) {
    throw fail(data.error || t('ai-content-service.unknown-error', 'Unknown error occurred'));
  }

  // The only terminal body left is a cancellation.
  throw new Error('Request was cancelled');
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
  const text = extractAnswerText(responseData);
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
 * Cancel an active content generation request
 * @param {string} requestId - Request ID to cancel
 * @returns {Promise<boolean>}
 */
export const cancelRequest = async requestId => {
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
  generateContent,
  cancelRequest,
  QUICK_ACTIONS,
  CONTEXT_TYPES
};
