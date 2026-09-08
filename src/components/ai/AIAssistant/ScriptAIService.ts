/**
 * Script AI Service - Dedicated service for AI-powered script generation
 * Handles API requests and polling for script writing operations
 */

// @ts-ignore - uuidv4 doesn't have types
import uuidV4 from 'uuidv4';

import { getWorkspaceId } from '@/helpers/urls';
import { buildRequestError } from './aiRequestError';
import { extractAnswerText } from './assistantResponse';
import { pollAiRequest, stopAiRequestPolling } from './aiRequestPolling';
import { MESSAGE_TYPES, API_ENDPOINTS, PLATFORM_CONFIG_AGENT_REF } from './constants';
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
      // COREDEV-323 FE-M5: route script generation to the config agent (engine CONFIG)
      // via agentRef instead of the removed forceIntent=SCRIPT_WRITING intent path. The
      // backend editScript tool reads the editing.script context below and returns the
      // same `script_writing` diff shape this service already consumes.
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
  return pollForResult(requestId, requestId, onProgress);
};

/**
 * Poll for script generation result. The clock, ramp, budget and cancel-on-give-up live in
 * `pollAiRequest`; only the reading of the answer is this service's own.
 */
const pollForResult = async (
  requestId: string,
  trackingId: string,
  onProgress?: (info: ProgressInfo) => void
): Promise<GenerateScriptResult> => {
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
    // Check if result is a script writing response
    const responseData = data.result;
    const isScriptDiffMessage = typeof responseData.message === 'object' && responseData.message?.type === MESSAGE_TYPES.SCRIPT_WRITING;

    if (isScriptDiffMessage) {
      const msg = responseData.message as ScriptWritingMessage;
      return {
        originalScript: msg.originalScript || '',
        modifiedScript: msg.modifiedScript || '',
        explanation: msg.explanation || '',
        contextType: msg.contextType || ''
      };
    }

    // Not a diff, but not a failure either: a question about the script («что делает этот
    // скрипт?») is answered with prose, and prose is a perfectly good answer — it just
    // proposes no edit. Rejecting it threw the answer away and closed the panel with a
    // technical error, so the user saw nothing at all (D-G-QA-DROP, case G14). An empty
    // `modifiedScript` is what says "nothing to apply"; `ScriptEditorAIButton` then shows the
    // script unchanged and puts the answer above it as the explanation.
    const answerText = extractAnswerText(responseData);
    if (answerText) {
      return {
        originalScript: '',
        modifiedScript: '',
        explanation: answerText,
        contextType: ''
      };
    }

    // Nothing text-like anywhere in the payload — there is genuinely nothing to show.
    throw new Error('Unexpected response type from AI');
  }

  if (data.error) {
    throw new Error(data.error || 'Unknown error occurred');
  }

  // The only terminal body left is a cancellation.
  throw new Error('Request was cancelled');
};

/**
 * Cancel an active script generation request
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
  generateScript,
  cancelRequest,
  ATTRIBUTE_TYPES,
  SCRIPT_CONTEXT_TYPES
};
