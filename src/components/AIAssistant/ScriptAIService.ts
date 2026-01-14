/**
 * Script AI Service - Dedicated service for AI-powered script generation
 * Handles API requests and polling for script writing operations
 */

// @ts-ignore - uuidv4 doesn't have types
import uuidV4 from 'uuidv4';

import { getWorkspaceId } from '@/helpers/urls';
import { AI_INTENTS, MESSAGE_TYPES, API_ENDPOINTS, POLLING_INTERVAL } from './constants';
import {
  ATTRIBUTE_TYPES,
  SCRIPT_CONTEXT_TYPES,
  type AttributeType,
  type ScriptContextType,
  type FieldInfo,
  type ProgressInfo
} from './types';

export { ATTRIBUTE_TYPES, SCRIPT_CONTEXT_TYPES };
export type { AttributeType, ScriptContextType, FieldInfo, ProgressInfo };

const MAX_POLLING_ATTEMPTS = 120; // 2 minutes max

const activePollingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Parameters for generateScript function
 */
export interface GenerateScriptParams {
  /** User's request/instruction */
  prompt?: string;
  /** Quick action ID (e.g., 'explain', 'fix', 'optimize') */
  quickAction?: string;
  /** Current script content (can be empty for new scripts) */
  currentScript: string;
  /** Script context type (e.g., 'bpmn_script_task') */
  contextType: string;
  /** Record reference for context */
  recordRef: string;
  /** ECOS type reference (e.g., 'emodel/type@my-type') */
  ecosType?: string;
  /** BPMN process definition reference */
  processRef?: string;
  /** Some meta information required for script generation */
  metadata?: string;
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
 * Result from generateScript function
 */
export interface GenerateScriptResult {
  originalScript: string;
  modifiedScript: string;
  explanation: string;
  contextType: string;
}

interface ScriptWritingMessage {
  type: string;
  originalScript?: string;
  modifiedScript?: string;
  explanation?: string;
  contextType?: string;
}

interface PollResponse {
  result?: {
    message?: ScriptWritingMessage | string;
  };
  error?: string;
  status?: string;
  progress?: ProgressInfo;
}

/**
 * Generate or modify a script using AI
 */
export const generateScript = async ({
  prompt,
  quickAction,
  currentScript,
  contextType,
  recordRef,
  ecosType,
  processRef,
  metadata,
  field,
  conversationId,
  onProgress,
  onRequestId
}: GenerateScriptParams): Promise<GenerateScriptResult> => {
  const requestData = {
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
        content: currentScript || '',
        recordRef: recordRef || '',
        contextType: contextType || '',
        ecosType: ecosType || '',
        processRef: processRef || '',
        metadata: metadata || '',
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
  return pollForResult(requestId, requestId, onProgress);
};

/**
 * Poll for script generation result
 */
const pollForResult = (
  requestId: string,
  trackingId: string,
  onProgress?: (info: ProgressInfo) => void
): Promise<GenerateScriptResult> => {
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
          // Check if result is a script writing response
          const responseData = data.result;
          const isScriptDiffMessage =
            typeof responseData.message === 'object' &&
            responseData.message?.type === MESSAGE_TYPES.SCRIPT_WRITING;

          if (isScriptDiffMessage) {
            const msg = responseData.message as ScriptWritingMessage;
            resolve({
              originalScript: msg.originalScript || '',
              modifiedScript: msg.modifiedScript || '',
              explanation: msg.explanation || '',
              contextType: msg.contextType || ''
            });
          } else {
            // Unexpected response type
            reject(new Error('Unexpected response type from AI'));
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
 * Cancel an active script generation request
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
  generateScript,
  cancelRequest,
  ATTRIBUTE_TYPES,
  SCRIPT_CONTEXT_TYPES
};
