import Records from '@citeck/records-core';
import { useState, useCallback, useRef } from 'react';

import editorContextService from '../EditorContextService';
import {
  AI_INTENTS,
  MESSAGE_TYPES,
  EDITOR_CONTEXT_HANDLERS,
  API_ENDPOINTS,
  CONTENT_TYPES,
  FILE_SAVE_ACTION,
  AGENT_TOOL_STEP_PROGRESS_TYPE,
  PLATFORM_CONFIG_AGENT_REF,
  buildAgentRef
} from '../constants';
import { AGENT_STATUSES } from '../types';
import { generateUUID } from '../utils';

import usePolling from './usePolling';

import { t } from '@/helpers/export/util';
import { getWorkspaceId } from '@/helpers/urls';

// Matches a markdown inline image: ![alt](url). URLs in our previews never contain ')'.
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;
// Captures the temp-file local id from either a record ref (`emodel/temp-file@<id>`) or a
// content download URL (`…/content?ref=temp-file@<id>` / url-encoded `temp-file%40<id>`).
const TEMP_FILE_ID_RE = /temp-file(?:@|%40)([^"'\s)&?#]+)/;

/**
 * If [actionId] is a pending-file save/cancel action (`<base>|<tempRef>`), returns its tempRef;
 * otherwise null. The tempRef lets us locate and clean up the now-dead preview once the temp
 * file backing it is deleted on save/cancel (COREDEV-321).
 * @param {string} actionId
 * @returns {string|null}
 */
const fileSaveActionTempRef = actionId => {
  if (typeof actionId !== 'string') {
    return null;
  }
  const sepIndex = actionId.indexOf(FILE_SAVE_ACTION.TEMP_REF_SEPARATOR);
  if (sepIndex < 0) {
    return null;
  }
  const baseAction = actionId.slice(0, sepIndex);
  const tempRef = actionId.slice(sepIndex + 1);
  if (!tempRef) {
    return null;
  }
  const isFileSaveAction =
    baseAction === FILE_SAVE_ACTION.MAIN_CONTENT ||
    baseAction === FILE_SAVE_ACTION.NEW_RECORD ||
    baseAction === FILE_SAVE_ACTION.CANCEL ||
    baseAction.startsWith(FILE_SAVE_ACTION.ATTR_PREFIX);
  return isFileSaveAction ? tempRef : null;
};

/** Extracts the temp-file local id from a ref or content URL; null if none present. */
const extractTempFileId = refOrUrl => {
  if (typeof refOrUrl !== 'string') {
    return null;
  }
  const match = TEMP_FILE_ID_RE.exec(refOrUrl);
  return match ? match[1] : null;
};

/**
 * Removes markdown image previews whose URL points to the given temp-file from a message text.
 * Used after a save/cancel deletes the temp file: its content URL would otherwise 500 on the
 * next render. Leftover blank lines are collapsed so the surrounding text stays tidy.
 * @param {*} text - Message text (left untouched if not a string)
 * @param {string} tempFileId - Temp-file local id whose previews must be dropped
 * @returns {*} The cleaned text, or the original value when nothing changed
 */
const stripTempImageFromText = (text, tempFileId) => {
  if (typeof text !== 'string' || !tempFileId || !text.includes(tempFileId)) {
    return text;
  }
  // Compare the exact temp-file id captured from each image URL (boundary-anchored via
  // TEMP_FILE_ID_RE) instead of a bare substring, so an id that is a prefix of another live
  // file's id can never strip the wrong preview.
  const next = text.replace(MARKDOWN_IMAGE_RE, image => (extractTempFileId(image) === tempFileId ? '' : image));
  if (next === text) {
    return text;
  }
  return next
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Merge two config-agent tool-step feeds by `stepIndex` (upsert), newest wins.
 *
 * The backend snapshot (`progress.toolSteps`) is self-contained, but the controller keeps only the
 * latest snapshot per request; merging with whatever the processing message already holds guarantees
 * no sub-second step (e.g. findArtifact) is lost when the frontend polls less often than steps
 * complete. For a given `stepIndex` the incoming step's fields override the previous one (so
 * RUNNING → DONE/ERROR transitions apply), and the result is sorted ascending by `stepIndex`.
 * @param {Array<{stepIndex:number}>} [prevSteps] - Steps already accumulated on the message
 * @param {Array<{stepIndex:number}>} [incomingSteps] - Steps from the latest progress snapshot
 * @returns {Array<Object>} Merged, stepIndex-sorted feed
 */
const mergeToolSteps = (prevSteps = [], incomingSteps = []) => {
  const byIndex = new Map();
  const add = step => {
    if (step && typeof step.stepIndex === 'number') {
      byIndex.set(step.stepIndex, { ...byIndex.get(step.stepIndex), ...step });
    }
  };
  (Array.isArray(prevSteps) ? prevSteps : []).forEach(add);
  (Array.isArray(incomingSteps) ? incomingSteps : []).forEach(add);
  return Array.from(byIndex.values()).sort((a, b) => a.stepIndex - b.stepIndex);
};

/**
 * Builds the tool-loop (`agent_tool_step`) messageData snapshot from a progress event.
 * The cumulative `toolSteps` feed is rebuilt by merging the incoming snapshot over any feed
 * already accumulated on the processing message (`prevToolSteps`).
 * @param {Object} progress - Progress data from polling (type === AGENT_TOOL_STEP_PROGRESS_TYPE)
 * @param {Array} [prevToolSteps] - Feed already on the message being updated
 * @returns {Object} messageData for the tool-step ribbon
 */
const buildToolStepMessageData = (progress, prevToolSteps = []) => ({
  type: AGENT_TOOL_STEP_PROGRESS_TYPE,
  tool: progress.tool,
  label: progress.label,
  status: progress.status,
  detail: progress.detail,
  stepIndex: progress.stepIndex,
  totalHint: progress.totalHint,
  // Engine of this feed (OPERATIONAL | CONFIGURATION) — titles the ribbon per engine.
  domain: progress.domain,
  toolSteps: mergeToolSteps(prevToolSteps, progress.toolSteps)
});

/**
 * Builds message data fields for a processing message based on progress type.
 * Returns the fields to merge onto the processing message, or null if no update.
 * @param {Object} progress - Progress data from polling
 * @returns {{ isAgent: boolean, isToolStep?: boolean, messageFields: Object }} Message fields to apply
 */
const buildProgressMessageData = progress => {
  // Config-agent tool-loop feed (contract #2). Recognised before the generic `agent_*` branch
  // because its shape (cumulative `toolSteps`) differs from plan-execute's fixed `steps`.
  if (progress.type === AGENT_TOOL_STEP_PROGRESS_TYPE) {
    return {
      isAgent: true,
      isToolStep: true,
      messageFields: {
        isAgentProgressContent: true,
        messageData: buildToolStepMessageData(progress)
      }
    };
  }

  const isAgentProgress = progress.type && progress.type.startsWith('agent_');

  if (isAgentProgress) {
    return {
      isAgent: true,
      messageFields: {
        isAgentProgressContent: true,
        messageData: {
          type: progress.type,
          currentStepId: progress.currentStepId,
          currentStepDescription: progress.currentStepDescription,
          completedSteps: progress.completedSteps,
          totalSteps: progress.totalSteps,
          overallProgress: progress.progress,
          steps: progress.steps
        }
      }
    };
  }

  return {
    isAgent: false,
    messageFields: {
      isBusinessAppContent: true,
      messageData: {
        type: MESSAGE_TYPES.BUSINESS_APP_GENERATION,
        stage: progress.stage,
        progress: progress.progress,
        message: progress.message,
        detailedStatus: progress.detailedStatus,
        stageMetadata: progress.stageMetadata,
        currentAttempt: progress.currentAttempt,
        maxAttempts: progress.maxAttempts
      }
    }
  };
};

/**
 * Builds the initial processing message based on initialProgress type.
 * Routes agent progress, business app progress, and generic messages.
 * @param {Object} data - Response data from async API call
 * @returns {Object} Processing message object
 */
const buildInitialProcessingMessage = data => {
  const base = {
    id: generateUUID(),
    sender: 'ai',
    timestamp: new Date(),
    isProcessing: true,
    pollingIsUsed: true
  };

  const initialProgress = data.initialProgress;
  const progressType = initialProgress?.type;

  // Config-agent tool-loop feed (contract #2) — render the cumulative tool-step ribbon.
  if (progressType === AGENT_TOOL_STEP_PROGRESS_TYPE) {
    return {
      ...base,
      isAgentProgressContent: true,
      messageData: buildToolStepMessageData(initialProgress)
    };
  }

  // Agent progress (type starts with 'agent_')
  if (progressType && progressType.startsWith('agent_')) {
    return {
      ...base,
      isAgentProgressContent: true,
      messageData: {
        type: progressType,
        currentStepId: initialProgress.currentStepId,
        currentStepDescription: initialProgress.currentStepDescription,
        completedSteps: initialProgress.completedSteps,
        totalSteps: initialProgress.totalSteps,
        overallProgress: initialProgress.overallProgress ?? initialProgress.progress,
        message: initialProgress.message
      }
    };
  }

  // Business app progress (by initialProgress.type or legacy detectedIntent fallback)
  if (progressType === 'business_app_generation' || (data.detectedIntent === 'BUSINESS_APP_GENERATION' && initialProgress)) {
    return {
      ...base,
      isBusinessAppContent: true,
      messageData: {
        type: MESSAGE_TYPES.BUSINESS_APP_GENERATION,
        stage: initialProgress.stage,
        progress: initialProgress.progress,
        message: initialProgress.message
      }
    };
  }

  // Generic processing message
  return {
    ...base,
    text: t('ai-assistant.message.processing-long')
  };
};

/**
 * Creates an AI message object based on response data
 * @param {Object} responseData - Response data from API
 * @param {Object} options - Additional options
 * @returns {Object} Message object
 */
const AGENT_PLAN_STATUSES = [
  AGENT_STATUSES.WAITING_PLAN_APPROVAL,
  AGENT_STATUSES.WAITING_STEP_APPROVAL,
  AGENT_STATUSES.COMPLETED,
  AGENT_STATUSES.FAILED
];

const createAIMessage = (responseData, options = {}) => {
  const { setGenerationStages, generationStages } = options;
  const messageData = responseData.message;

  // Agent mode messages (determined by agentStatus in response)
  if (responseData.agentStatus) {
    const isAgentPlan = AGENT_PLAN_STATUSES.includes(responseData.agentStatus);

    if (isAgentPlan) {
      return {
        id: generateUUID(),
        text: typeof messageData === 'object' ? messageData.message : messageData || '',
        sender: 'ai',
        timestamp: new Date(),
        isAgentPlanContent: true,
        messageData: {
          agentStatus: responseData.agentStatus,
          message: typeof messageData === 'object' ? messageData.message : messageData,
          plan: typeof messageData === 'object' ? messageData.plan : undefined,
          artifacts: responseData.artifacts,
          contextArtifacts: responseData.contextArtifacts,
          actions: responseData.actions
        }
      };
    }

    // PLANNING, EXECUTING — progress states
    return {
      id: generateUUID(),
      text: typeof messageData === 'object' ? messageData.message : messageData || t('ai-assistant.chat.processing'),
      sender: 'ai',
      timestamp: new Date(),
      isAgentProgressContent: true,
      messageData: {
        agentStatus: responseData.agentStatus,
        message: typeof messageData === 'object' ? messageData.message : messageData,
        actions: responseData.actions
      }
    };
  }

  const isObjectMessage = typeof messageData === 'object';

  // Check message types
  const isEmailMessage = isObjectMessage && messageData?.type === MESSAGE_TYPES.EMAIL;
  const isTextDiffMessage = isObjectMessage && messageData?.type === MESSAGE_TYPES.TEXT_EDITING;
  const isScriptDiffMessage = isObjectMessage && messageData?.type === MESSAGE_TYPES.SCRIPT_WRITING;
  const isBusinessAppMessage = isObjectMessage && messageData?.type === MESSAGE_TYPES.BUSINESS_APP_GENERATION;

  if (isEmailMessage) {
    return {
      id: generateUUID(),
      text: messageData.body,
      sender: 'ai',
      timestamp: new Date(),
      isEmailContent: true,
      messageData: messageData
    };
  }

  if (isTextDiffMessage) {
    return {
      id: generateUUID(),
      text: messageData.description || t('ai-assistant.chat.suggested-changes'),
      sender: 'ai',
      timestamp: new Date(),
      isTextDiffContent: true,
      messageData: messageData
    };
  }

  if (isScriptDiffMessage) {
    return {
      id: generateUUID(),
      text: messageData.explanation || t('ai-assistant.chat.suggested-script-changes'),
      sender: 'ai',
      timestamp: new Date(),
      isScriptDiffContent: true,
      messageData: messageData
    };
  }

  if (isBusinessAppMessage) {
    if (messageData.availableStages && !generationStages) {
      setGenerationStages?.(messageData.availableStages);
    }
    return {
      id: generateUUID(),
      text: messageData.message || t('ai-assistant.chat.processing-request'),
      sender: 'ai',
      timestamp: new Date(),
      isBusinessAppContent: true,
      messageData: messageData
    };
  }

  // Default text message
  const defaultMessage = {
    id: generateUUID(),
    text: messageData || t('ai-assistant.chat.no-response'),
    sender: 'ai',
    timestamp: new Date()
  };

  const hasContextArtifacts = responseData.contextArtifacts?.length > 0;
  // Deployed artifacts (types/forms/processes) carry a clickable link so the user can open and
  // verify what was just deployed. The config agent returns them on the plain deploy-success
  // message, so the default branch must forward them (parity with the agent-plan branch above);
  // otherwise the links are silently dropped for config-agent deploys (COREDEV-323 regression).
  const hasArtifacts = responseData.artifacts?.length > 0;
  const hasActions = responseData.actions?.length > 0;
  const hasPendingDeploy = !!responseData.pendingDeploy;

  if (hasContextArtifacts || hasArtifacts || hasActions || hasPendingDeploy) {
    defaultMessage.messageData = {
      ...(hasContextArtifacts && { contextArtifacts: responseData.contextArtifacts }),
      ...(hasArtifacts && { artifacts: responseData.artifacts }),
      ...(hasActions && { actions: responseData.actions }),
      ...(hasPendingDeploy && { pendingDeploy: responseData.pendingDeploy })
    };
  }

  return defaultMessage;
};

/**
 * Hook for managing universal chat functionality
 * @param {Object} options - Configuration options
 * @param {Object} options.additionalContext - Additional context data
 * @param {Array} options.uploadedFiles - Uploaded files
 * @param {Function} options.clearUploadedFiles - Function to clear uploaded files
 * @param {Function} options.clearAllContext - Function to clear all context
 * @returns {Object} Universal chat state and handlers
 */
const useUniversalChat = (options = {}) => {
  const {
    additionalContext = { records: [], documents: [], attributes: [] },
    uploadedFiles = [],
    clearUploadedFiles,
    clearAllContext
  } = options;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => generateUUID());
  const [conversationForceIntent, setConversationForceIntent] = useState(null);
  const [activeBusinessAppProgress, setActiveBusinessAppProgress] = useState(null);
  const [generationStages, setGenerationStages] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [autoContextArtifacts, setAutoContextArtifacts] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // tempRef of the pending file whose save/cancel is currently in flight. Set when a file-save
  // action is clicked, consumed by handlePollingResult to drop the dead preview once the temp
  // file is gone, and cleared on any terminal/non-file flow so it never triggers a stale strip.
  const pendingFileActionTempRef = useRef(null);

  // Single place to forget the in-flight tracked tempRef. Every terminal/non-file flow calls
  // this instead of re-stating the assignment, so a newly added terminal path can't silently
  // skip the clear and leave a stale tempRef that would strip a still-live preview.
  const clearPendingFileAction = useCallback(() => {
    pendingFileActionTempRef.current = null;
  }, []);

  // Fetch status function for polling
  const fetchStatus = useCallback(async requestId => {
    const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_STATUS}/${requestId}`);
    if (!response.ok) {
      // Surface the backend's friendly error body (e.g. overload: { error, retryAfterSeconds })
      // instead of a raw status, so the chat shows the human message, not "Error: 500".
      const body = await response.json().catch(() => null);
      if (body?.error) {
        const err = new Error(body.error);
        if (body.retryAfterSeconds != null) err.retryAfterSeconds = body.retryAfterSeconds;
        throw err;
      }
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  }, []);

  // Handle polling result
  const handlePollingResult = useCallback(
    result => {
      setIsLoading(false);

      if (result.agentStatus) {
        setAgentStatus(result.agentStatus);
      } else {
        setAgentStatus(null);
      }

      if (result.forceIntent) {
        setConversationForceIntent(result.forceIntent);
      }

      if (result.contextArtifacts) {
        const manualRefs = new Set((additionalContext.records || []).map(r => r.recordRef));
        setAutoContextArtifacts(result.contextArtifacts.filter(a => !manualRefs.has(a.ref)));
      }

      const isBusinessAppCompleted =
        typeof result.message === 'object' &&
        result.message?.type === MESSAGE_TYPES.BUSINESS_APP_GENERATION &&
        result.message?.stage === 'COMPLETED';

      if (isBusinessAppCompleted) {
        setTimeout(() => {
          setActiveBusinessAppProgress(null);
          setGenerationStages(null);
        }, 5000);
      }

      // A just-finished save/cancel deletes the temp file backing the original "Сохранить?" preview,
      // so its <img src> (temp-file content URL) now 500s. If the backend's authoritative live
      // snapshot (`pendingFiles`) no longer lists that tempRef, the file is gone — drop the dead
      // preview from chat history. Retryable errors keep the pending alive (tempRef still listed),
      // so we leave those previews untouched. The success message already carries a working preview
      // from the new permanent record where applicable (COREDEV-313 / COREDEV-321).
      const consumedTempRef = pendingFileActionTempRef.current;
      clearPendingFileAction();
      let deadTempFileId = null;
      if (consumedTempRef) {
        const aliveTempRefs = new Set((result.pendingFiles || []).map(file => file.tempRef));
        if (!aliveTempRefs.has(consumedTempRef)) {
          deadTempFileId = extractTempFileId(consumedTempRef);
        }
      }

      setMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => !msg.isProcessing);
        const aiMessage = createAIMessage(result, { setGenerationStages, generationStages });
        const nextMessages = [...filteredMessages, aiMessage];
        if (!deadTempFileId) {
          return nextMessages;
        }
        return nextMessages.map(msg => {
          const cleanedText = stripTempImageFromText(msg.text, deadTempFileId);
          return cleanedText === msg.text ? msg : { ...msg, text: cleanedText };
        });
      });
    },
    [generationStages, additionalContext, clearPendingFileAction]
  );

  // Handle polling error
  const handlePollingError = useCallback(
    error => {
      // The temp file may still be alive (network/processing failure), so don't risk a stale strip.
      clearPendingFileAction();
      setIsLoading(false);
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.isProcessing) {
            return {
              ...msg,
              text: typeof error === 'string' ? t('ai-assistant.chat.error-prefix', { error }) : t('ai-assistant.chat.result-error'),
              isProcessing: false,
              isError: true
            };
          }
          return msg;
        })
      );
    },
    [clearPendingFileAction]
  );

  // Handle polling cancelled
  const handlePollingCancelled = useCallback(() => {
    clearPendingFileAction();
    setIsLoading(false);
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.isProcessing) {
          return {
            ...msg,
            text: t('ai-assistant.chat.cancelled'),
            isProcessing: false,
            isCancelled: true
          };
        }
        return msg;
      })
    );
  }, [clearPendingFileAction]);

  // Handle polling progress
  const handlePollingProgress = useCallback(
    progress => {
      const { isAgent, isToolStep, messageFields } = buildProgressMessageData(progress);

      if (isAgent) {
        const progressType = progress.type;
        if (progressType === 'agent_planning') {
          setAgentStatus(AGENT_STATUSES.PLANNING);
        } else if (progressType === 'agent_execution') {
          setAgentStatus(AGENT_STATUSES.EXECUTING);
        }

        // Business-app stepper piggyback: during planning/execution the standalone
        // `business_app_generation` snapshots stop, so the top stepper advances by riding on the
        // `businessApp` field the backend attaches to `agent_planning`/`agent_execution` emissions.
        // The agent checklist card (built from `messageFields`) is untouched.
        const businessApp = progress.businessApp;
        if (businessApp) {
          setActiveBusinessAppProgress({
            stage: businessApp.stage,
            progress: businessApp.progress
          });
          if (businessApp.availableStages && !generationStages) {
            setGenerationStages(businessApp.availableStages);
          }
        }
      }

      if (!isAgent) {
        setActiveBusinessAppProgress({
          stage: progress.stage,
          progress: progress.progress,
          message: progress.message,
          detailedStatus: progress.detailedStatus,
          stageMetadata: progress.stageMetadata,
          currentAttempt: progress.currentAttempt,
          maxAttempts: progress.maxAttempts
        });

        if (progress.availableStages && !generationStages) {
          setGenerationStages(progress.availableStages);
        }
      }

      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.isProcessing) {
            // Tool-loop feed is cumulative: merge the incoming snapshot over the steps already on
            // the message by `stepIndex`, so a step that completed between two polls isn't dropped.
            if (isToolStep) {
              return {
                ...msg,
                ...messageFields,
                messageData: {
                  ...messageFields.messageData,
                  // Preserve a previously-stamped engine if a later poll omits it.
                  domain: messageFields.messageData?.domain || msg.messageData?.domain,
                  toolSteps: mergeToolSteps(msg.messageData?.toolSteps, progress.toolSteps)
                }
              };
            }
            return { ...msg, ...messageFields };
          }
          return msg;
        })
      );
    },
    [generationStages]
  );

  // Use polling hook
  const { startPolling, stopPolling, activeRequestId } = usePolling({
    fetchStatus,
    onResult: handlePollingResult,
    onError: handlePollingError,
    onCancelled: handlePollingCancelled,
    onProgress: handlePollingProgress
  });

  // Handle submit
  const handleSubmit = useCallback(
    async e => {
      e?.preventDefault();
      if (!message.trim()) return;

      // A new free-text turn is not a file save — clear any leftover tempRef from an earlier
      // action so this turn's result can't accidentally strip a still-live preview.
      clearPendingFileAction();

      const userMessage = { id: generateUUID(), text: message, sender: 'user', timestamp: new Date() };
      setMessages(prevMessages => [...prevMessages, userMessage]);

      const messageToProcess = message;
      setMessage('');
      setIsLoading(true);

      try {
        const contextToSend = {
          records: additionalContext.records ? Object.values(additionalContext.records) : [],
          documents: additionalContext.documents ? Object.values(additionalContext.documents) : [],
          attributes: additionalContext.attributes ? Object.values(additionalContext.attributes) : []
        };

        // Auto-include parent records from documents
        if (contextToSend.documents.length > 0 && contextToSend.records.length === 0) {
          const parentRefs = contextToSend.documents.map(doc => doc.parentRef).filter(parentRef => parentRef);

          const uniqueParentRefs = [...new Set(parentRefs)];

          for (const parentRef of uniqueParentRefs) {
            try {
              const parentRecordData = await Records.get(parentRef).load({
                displayName: '?disp',
                type: '_type?id'
              });

              contextToSend.records.push({
                recordRef: parentRef,
                displayName: parentRecordData.displayName,
                type: parentRecordData.type
              });
            } catch (error) {
              console.error('Error loading parent record:', parentRef, error);
            }
          }
        }

        const contextData = editorContextService.getContextData();
        const forceIntent = conversationForceIntent || contextData.forceIntent || null;

        const selectionData = {
          records: contextToSend.records || [],
          attributes: contextToSend.attributes || [],
          documents: contextToSend.documents || []
        };

        const contentData = {
          documents: uploadedFiles
        };

        // Build editing context based on intent
        let editing = null;

        if (forceIntent === AI_INTENTS.TEXT_EDITING) {
          const getCurrentTextHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.GET_CURRENT_TEXT);
          const editorContextData = editorContextService.getContextData();

          let currentText = '';
          let selectedText = '';

          if (typeof getCurrentTextHandler === 'function') {
            currentText = getCurrentTextHandler() || '';
          }

          if (editorContextData.selectionContext) {
            selectedText = editorContextData.selectionContext.html || '';
          }

          editing = {
            type: 'text',
            quickAction: '',
            content: currentText,
            selectedContent: selectedText,
            recordRef: editorContextData.recordRef || '',
            contentType: CONTENT_TYPES.TEXT,
            fieldType: ''
          };
        }

        if (forceIntent === AI_INTENTS.SCRIPT_WRITING) {
          const getCurrentScriptHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.GET_CURRENT_SCRIPT);
          const scriptContextData = editorContextService.getContextData();

          let currentScript = '';
          try {
            if (typeof getCurrentScriptHandler === 'function') {
              currentScript = getCurrentScriptHandler();
            }
          } catch (error) {
            console.error('Error getting current script:', error);
          }

          editing = {
            type: 'script',
            quickAction: '',
            content: currentScript,
            recordRef: scriptContextData.recordRef || '',
            contextType: scriptContextData.scriptContextType || '',
            ecosType: scriptContextData.ecosType || '',
            processRef: scriptContextData.processRef || ''
          };
        }

        // COREDEV-323 FE-M5: script editing routes to the config agent (engine CONFIG) via
        // agentRef instead of the removed forceIntent=SCRIPT_WRITING intent path. The config
        // agent's editScript tool reads the editing.script context and returns the script_writing
        // diff. An explicitly selected agent still wins for non-script turns; forceIntent is no
        // longer sent for scripts (backend keys editing dispatch on editing.type). TEXT_EDITING
        // stays operational and keeps sending forceIntent.
        const isScriptEditing = forceIntent === AI_INTENTS.SCRIPT_WRITING;
        const agentRefToSend = isScriptEditing
          ? PLATFORM_CONFIG_AGENT_REF
          : selectedAgent
            ? buildAgentRef(selectedAgent.id)
            : null;

        const requestData = {
          message: messageToProcess,
          conversationId: conversationId,
          context: {
            workspace: getWorkspaceId(),
            selection: selectionData,
            content: contentData,
            ...(forceIntent && !isScriptEditing && { forceIntent }),
            ...(editing && { editing }),
            ...(autoContextArtifacts.length > 0 && { contextArtifacts: autoContextArtifacts }),
            ...(agentRefToSend && { agentRef: agentRefToSend })
          }
        };

        const response = await fetch(API_ENDPOINTS.UNIVERSAL_ASYNC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        const requestId = data.requestId;

        if (!requestId) {
          throw new Error(t('ai-assistant.chat.no-request-id'));
        }

        if (data.initialProgress?.availableStages) {
          setGenerationStages(data.initialProgress.availableStages);
        }

        startPolling(requestId);

        const processingMessage = buildInitialProcessingMessage(data);

        setMessages(prevMessages => [...prevMessages, processingMessage]);
      } catch (error) {
        console.error('Error in universal chat:', error);

        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: generateUUID(),
            text: t('ai-assistant.chat.request-error'),
            sender: 'ai',
            timestamp: new Date(),
            isError: true
          }
        ]);

        setIsLoading(false);
      }
    },
    [
      message,
      conversationId,
      additionalContext,
      uploadedFiles,
      conversationForceIntent,
      autoContextArtifacts,
      selectedAgent,
      startPolling,
      clearPendingFileAction
    ]
  );

  // Cancel active request
  const cancelRequest = useCallback(async () => {
    if (!activeRequestId) return;

    clearPendingFileAction();

    try {
      const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_STATUS}/${activeRequestId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.error(`Error cancelling request: ${response.status}`);
        return;
      }

      stopPolling();

      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.isProcessing) {
            return {
              ...msg,
              text: t('ai-assistant.chat.cancelled'),
              isProcessing: false,
              isCancelled: true
            };
          }
          return msg;
        })
      );

      setIsLoading(false);
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  }, [activeRequestId, stopPolling, clearPendingFileAction]);

  // Handle action button click (plan approval, error recovery)
  const handleActionClick = useCallback(
    async (actionId, extra = {}) => {
      if (!conversationId) return;

      // Remember which pending file this action targets (null for non-file actions) so the result
      // handler can clean up its dead temp-file preview once the save/cancel completes.
      pendingFileActionTempRef.current = fileSaveActionTempRef(actionId);

      setIsLoading(true);

      try {
        const requestData = {
          message: '',
          action: actionId,
          conversationId: conversationId,
          context: {
            workspace: getWorkspaceId()
          },
          // Deploy scope override (COREDEV-323 contract #3) is strictly optional — only the
          // config-agent deploy_confirm action sends it; all other actions stay unchanged.
          ...(extra && extra.deployScope && { deployScope: extra.deployScope })
        };

        const response = await fetch(API_ENDPOINTS.UNIVERSAL_ASYNC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        const requestId = data.requestId;

        if (!requestId) {
          throw new Error(t('ai-assistant.chat.no-request-id'));
        }

        // Remove actions only from the message whose action was clicked, so that other
        // assistant messages keep their own buttons live (e.g. multiple pending images, or
        // several deploy confirmations sharing the stable deploy_confirm/deploy_reject ids).
        // Scope by the originating message id when the caller supplies it; fall back to the
        // legacy actionId match for action sources that don't pass a message id.
        const clickedMessageId = extra && extra.messageId;
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            const isClicked = clickedMessageId ? msg.id === clickedMessageId : msg.messageData?.actions?.some(a => a.id === actionId);
            return isClicked ? { ...msg, messageData: { ...msg.messageData, actions: null } } : msg;
          })
        );

        startPolling(requestId);

        const processingMessage = buildInitialProcessingMessage(data);
        setMessages(prevMessages => [...prevMessages, processingMessage]);
      } catch (error) {
        console.error('Error sending action:', error);

        // The request never reached the backend, so the temp file is untouched and polling never
        // started — forget the tracked tempRef so a later unrelated result can't strip a live preview.
        clearPendingFileAction();

        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: generateUUID(),
            text: t('ai-assistant.chat.action-error'),
            sender: 'ai',
            timestamp: new Date(),
            isError: true
          }
        ]);

        setIsLoading(false);
      }
    },
    [conversationId, startPolling, clearPendingFileAction]
  );

  // Remove a single auto context artifact by ref
  const removeAutoContextArtifact = useCallback(ref => {
    setAutoContextArtifacts(prev => prev.filter(a => a.ref !== ref));
  }, []);

  // Clear conversation
  const clearConversation = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_CONVERSATION}/${conversationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages([]);
        setConversationId(generateUUID());
        setConversationForceIntent(null);
        setActiveBusinessAppProgress(null);
        setGenerationStages(null);
        setAgentStatus(null);
        setAutoContextArtifacts([]);

        clearAllContext?.();
        clearUploadedFiles?.();

        editorContextService.clearContext();
      }
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  }, [conversationId, clearAllContext, clearUploadedFiles]);

  return {
    // State
    message,
    messages,
    isLoading,
    conversationId,
    activeRequestId,
    conversationForceIntent,
    activeBusinessAppProgress,
    generationStages,
    agentStatus,
    autoContextArtifacts,
    selectedAgent,

    // Setters
    setMessage,
    setMessages,
    setAutoContextArtifacts,
    setSelectedAgent,

    // Actions
    handleSubmit,
    handleActionClick,
    cancelRequest,
    clearConversation,
    removeAutoContextArtifact
  };
};

export {
  createAIMessage,
  buildProgressMessageData,
  buildInitialProcessingMessage,
  buildToolStepMessageData,
  mergeToolSteps,
  fileSaveActionTempRef,
  extractTempFileId,
  stripTempImageFromText
};
export default useUniversalChat;
