import Records from '@citeck/records-core';
import { useState, useCallback, useRef } from 'react';

import editorContextService from '../EditorContextService';
import {
  AI_INTENTS,
  MESSAGE_TYPES,
  EDITOR_CONTEXT_HANDLERS,
  API_ENDPOINTS,
  CONTENT_TYPES,
  AGENT_TOOL_STEP_PROGRESS_TYPE,
  PLATFORM_CONFIG_AGENT_REF,
  buildAgentRef
} from '../constants';
import { AGENT_STATUSES } from '../types';
// `fileSaveActionTempRef` lives in utils.js next to the staleness rule that shares it; it stays
// re-exported from this module for backward compatibility with existing importers.
import { generateUUID, fileSaveActionTempRef } from '../utils';

import usePolling from './usePolling';

import { t } from '@/helpers/export/util';
import { getWorkspaceId } from '@/helpers/urls';

// Matches a markdown inline image: ![alt](url). URLs in our previews never contain ')'.
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;
// Captures the temp-file local id from either a record ref (`emodel/temp-file@<id>`) or a
// content download URL (`…/content?ref=temp-file@<id>` / url-encoded `temp-file%40<id>`).
const TEMP_FILE_ID_RE = /temp-file(?:@|%40)([^"'\s)&?#]+)/;

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
      // The request list lives in the service's memory, so a restart loses it and every later poll
      // answers 404 with an empty body (same answer as for another user's or an expired request).
      // Say the request is lost — "Ошибка: Error: 404" told the user nothing actionable (D-B-7).
      if (response.status === 404) {
        const err = new Error(t('ai-assistant.chat.request-lost'));
        err.requestLost = true;
        throw err;
      }
      // Surface the backend's friendly error body (e.g. overload: { error, retryAfterSeconds })
      // instead of a raw status, so the chat shows the human message, not "Error: 500".
      const body = await response.json().catch(() => null);
      if (body?.error) {
        const err = new Error(body.error);
        if (body.retryAfterSeconds != null) err.retryAfterSeconds = body.retryAfterSeconds;
        throw err;
      }
      throw new Error(t('ai-assistant.chat.http-error', { status: response.status }));
    }
    return response.json();
  }, []);

  // Handle polling result
  const handlePollingResult = useCallback(
    result => {
      setIsLoading(false);

      // Set when this result answers a file-save/cancel click. `handlePendingFileSaveAction`
      // short-circuits before the request reaches the agent, so such a result decides one file
      // and leaves the dialog — and the agent state behind it — exactly where it was.
      const consumedTempRef = pendingFileActionTempRef.current;
      clearPendingFileAction();

      if (result.agentStatus) {
        setAgentStatus(result.agentStatus);
      } else if (!consumedTempRef) {
        // A file answer carries no `agentStatus` because it never asked the agent anything;
        // clearing the indicator would claim the agent stopped waiting when it still is.
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

      // `result.pendingFiles` is the backend's authoritative list of the pending files still alive
      // in this conversation (`AgentOrchestratorService.enrichWithPendingFile` /
      // `handlePendingFileSaveAction`). Everything it does NOT list is gone server-side, and both
      // things the UI shows for such a file are now wrong: its Save/Cancel pair would post an action
      // for a deleted tempRef, and its preview <img src> (a temp-file content URL) 500s.
      //
      // Presence of the field is what makes it meaningful, not its length: every response leaving
      // the chat front door carries the snapshot (`AgentOrchestratorService.processRequest` →
      // `attachPendingFilesSnapshot`), and `[]` explicitly states that no proposal is left. Only
      // `null` — a response assembled outside that front door, e.g. a controller error envelope —
      // means "no information about files", and then nothing may be pruned. This is what lets the
      // UI retire buttons for proposals that died without their own click: a free-text refusal
      // routed to `discardPendingFile`, a legacy tempRef-less `file_cancel`, expiry by
      // `PendingFileCleanupScheduler`.
      const aliveTempRefs = new Set(
        (Array.isArray(result.pendingFiles) ? result.pendingFiles : []).map(file => file && file.tempRef).filter(Boolean)
      );
      const hasLiveSnapshot = Array.isArray(result.pendingFiles);

      setMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => !msg.isProcessing);
        const resultMessage = createAIMessage(result, { setGenerationStages, generationStages });
        // Mark the answer to a file click as a notice about that file rather than a step of the
        // dialog, so `isGateStale` does not count it as having moved the conversation past the
        // gate the same message may have offered next to the Save/Cancel pair.
        const aiMessage = consumedTempRef ? { ...resultMessage, isFileActionNotice: true } : resultMessage;
        const nextMessages = [...filteredMessages, aiMessage];

        // A Save/Cancel pair the new message carries is the authoritative offer for that file: a
        // retryable save error makes the backend re-emit the pairs of **every** surviving pending
        // (`handlePendingFileSaveAction` → `enrichWithPendingFile` with an empty `previousTempRefs`,
        // `AgentOrchestratorService.kt:806-812`), so a file already offered by an earlier message
        // would end up with two live pairs at once. Retire the older copies — one file must never
        // show two competing offers. Success/cancel responses re-emit nothing, so they are unaffected.
        const reofferedTempRefs = new Set(
          (aiMessage.messageData?.actions || []).map(action => fileSaveActionTempRef(action && action.id)).filter(Boolean)
        );

        // The consumed tempRef is checked without the snapshot: the file this click answered is
        // decided either way, and on the older backend — which omitted `pendingFiles` from
        // file-action responses — that is the only thing such a response states. A cancel of an
        // already-expired pending answers a file that no message may still offer buttons for, and
        // is covered by the same check.
        const deadTempRefs = new Set();
        if (consumedTempRef && !aliveTempRefs.has(consumedTempRef)) {
          deadTempRefs.add(consumedTempRef);
        }
        // Sweeping the whole history, on the other hand, requires the snapshot: `aliveTempRefs` is
        // empty whenever the field is absent, so running the sweep without it would declare every
        // pending file of the conversation dead — retiring the buttons and stripping the previews
        // of files the answered click never touched.
        if (hasLiveSnapshot) {
          nextMessages.forEach(msg => {
            (msg.messageData?.actions || []).forEach(action => {
              const tempRef = fileSaveActionTempRef(action && action.id);
              if (tempRef && !aliveTempRefs.has(tempRef)) {
                deadTempRefs.add(tempRef);
              }
            });
          });
        }
        if (!deadTempRefs.size && !reofferedTempRefs.size) {
          return nextMessages;
        }

        // Only the previews of files that are gone may be stripped; a re-offered file is still alive.
        const deadTempFileIds = [...deadTempRefs].map(extractTempFileId).filter(Boolean);
        const retiredOnOlderMessages = new Set([...deadTempRefs, ...reofferedTempRefs]);
        return nextMessages.map(msg => {
          let next = msg;

          // Retire the buttons of every dead tempRef this message offers. `resolvedFileTempRefs` is
          // the same list `handleActionClick` writes on a click — `MessageActions` disables a
          // file-save button whose tempRef is in it, which is what the position-based staleness rule
          // deliberately cannot do for file-save actions (they are resource-scoped, not gate-scoped).
          // One dead file contributes several actions (Save + Cancel, plus one per placement
          // option), so the tempRefs are deduplicated before being appended.
          const retired = msg === aiMessage ? deadTempRefs : retiredOnOlderMessages;
          const offered = new Set(
            (msg.messageData?.actions || [])
              .map(action => fileSaveActionTempRef(action && action.id))
              .filter(tempRef => tempRef && retired.has(tempRef))
          );
          if (offered.size) {
            const resolved = msg.messageData?.resolvedFileTempRefs || [];
            const added = [...offered].filter(tempRef => !resolved.includes(tempRef));
            if (added.length) {
              next = { ...next, messageData: { ...next.messageData, resolvedFileTempRefs: [...resolved, ...added] } };
            }
          }

          // Both copies of the message body have to be cleaned. `createAIMessage` writes the same
          // string into `text` and into `messageData.message` for agent cards, and the renderers
          // prefer the `messageData` copy: `AgentPlanMessage` shows `messageData.message || text`,
          // `BusinessAppMessage` shows `detailedStatus || text || messageData.message`. Stripping
          // only `text` would leave the dead preview on screen — and worse for the latter, an
          // emptied `text` falls through to the un-stripped copy, so the strip would flip the card
          // onto the very <img src> it was meant to remove.
          const strip = value => deadTempFileIds.reduce((acc, id) => stripTempImageFromText(acc, id), value);
          const cleanedText = strip(next.text);
          const cleanedMessage = strip(next.messageData?.message);

          let cleaned = next;
          if (cleanedText !== next.text) {
            cleaned = { ...cleaned, text: cleanedText };
          }
          if (cleanedMessage !== next.messageData?.message) {
            cleaned = { ...cleaned, messageData: { ...cleaned.messageData, message: cleanedMessage } };
          }
          return cleaned;
        });
      });
    },
    [generationStages, additionalContext, clearPendingFileAction]
  );

  // Handle polling error
  const handlePollingError = useCallback(
    (error, meta = {}) => {
      // The temp file may still be alive (network/processing failure), so don't risk a stale strip.
      clearPendingFileAction();
      setIsLoading(false);
      // Nothing is running after a failed turn: the stage indicator and the agent status have to go,
      // or they keep announcing progress for a request that is already dead (D-B-7). `generationStages`
      // goes with them — it is cleared on the success path too, and while it is set the three
      // `!generationStages` guards refuse to install the stage list of the NEXT request, so a failed
      // generation would leave its own timeline on top of an unrelated one that follows.
      setActiveBusinessAppProgress(null);
      setAgentStatus(null);
      setGenerationStages(null);
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.isProcessing) {
            const text = meta.requestLost
              ? t('ai-assistant.chat.request-lost')
              : typeof error === 'string'
                ? t('ai-assistant.chat.error-prefix', { error })
                : t('ai-assistant.chat.result-error');

            return {
              ...msg,
              text,
              isProcessing: false,
              isError: true,
              // Progress cards render from `messageData`, never from `text`. Without stamping the
              // failure here the card went on showing "Обработка 5 %" with a filled bar, and a
              // `detailedStatus` from the last good poll hid the error text entirely — the request
              // looked alive forever (D-B-7, BusinessAppMessage).
              ...(msg.messageData
                ? {
                    messageData: {
                      ...msg.messageData,
                      error: true,
                      detailedStatus: null,
                      stageMetadata: {
                        ...msg.messageData.stageMetadata,
                        severity: 'ERROR',
                        icon: 'fa-exclamation-triangle',
                        animated: false,
                        label: t('ai-assistant.chat.request-failed')
                      }
                    }
                  }
                : {})
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

      // Whether the POST was accepted. The `try` below can also throw *after* a 2xx — a missing
      // requestId, an unparseable body, a throw out of `startPolling` — and in those cases the turn
      // did reach the backend and may well be running there, so it must not be marked a failed send.
      let requestAccepted = false;

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
        const agentRefToSend = isScriptEditing ? PLATFORM_CONFIG_AGENT_REF : selectedAgent ? buildAgentRef(selectedAgent.id) : null;

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
          // The backend explains a refusal in the body: 409 carries which request holds the
          // conversation, 400 the validation reason. Dropping it left the user with a generic
          // "try again" for a state that retrying cannot fix (D-B-12). `userMessage` marks wording
          // that came from the backend and is safe to show as-is — unlike a transport failure.
          const body = await response.json().catch(() => null);

          if (body?.error) {
            const err = new Error(body.error);
            err.userMessage = body.error;
            throw err;
          }

          // Refusals with an empty body (403 license, 404 conversation ownership) still have to name
          // the status: the catch below shows `userMessage` and falls back to generic advice, so
          // without it this computed message was built and thrown away.
          const httpError = new Error(t('ai-assistant.chat.http-error', { status: response.status }));
          httpError.userMessage = httpError.message;
          throw httpError;
        }

        requestAccepted = true;

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

        // When the turn never reached the backend the dialog did not move, so the gate this reply
        // was meant to answer must stay live. The user message is appended before the request, so
        // it has to say so itself: `isSupersededByNewerMessage` skips it, exactly as it skips the
        // error notice appended right below. Without the flag a failed send would retire a gate the
        // agent is still waiting on, leaving free text as the only way to answer it.
        //
        // Once the POST has been accepted the flag must NOT be written, even though the turn still
        // ends in this `catch`: the backend has the message and may apply it, and a gate left live
        // there invites a second, conflicting answer to a turn already in flight. Same rule as a
        // polling failure, which keeps `actionsResolved` set for exactly this reason.
        setMessages(prevMessages => [
          ...(requestAccepted ? prevMessages : prevMessages.map(msg => (msg.id === userMessage.id ? { ...msg, isFailedSend: true } : msg))),
          {
            id: generateUUID(),
            // Only the backend's own wording is shown; a transport error keeps the generic advice
            text: error?.userMessage || t('ai-assistant.chat.request-error'),
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

      // Which pending file this action targets, null for a dialog action. One derivation for the
      // whole handler: it decides both what the result handler cleans up (the dead temp-file
      // preview, via the ref below) and how the click is recorded on the messages further down.
      const clickedTempRef = fileSaveActionTempRef(actionId);
      pendingFileActionTempRef.current = clickedTempRef;

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

        // Mark as resolved only the message whose action was clicked, so that other assistant
        // messages keep their own buttons live (e.g. multiple pending images, or several deploy
        // confirmations sharing the stable deploy_confirm/deploy_reject ids).
        // Scope by the originating message id when the caller supplies it; fall back to the
        // legacy actionId match for action sources that don't pass a message id — a message
        // already resolved is skipped there, since its buttons no longer belong to a live gate.
        // The actions themselves are kept: `isGateStale` reads the flag and renders the
        // buttons disabled, so the history stays readable instead of losing the choice offered.
        //
        // A file-save button resolves its own temp file, not the dialog gate it may be sitting next
        // to: the backend appends a Save/Cancel pair per new pending file onto the same message that
        // carries the gate of that turn, so one message may hold several independent decisions. Such
        // a click is therefore recorded as a resolved tempRef, which retires the pair it answers
        // wherever it is rendered; the gate half and the pairs of the other files stay live.
        // A tempRef is scoped to the conversation, not to one message: a retryable save error makes
        // the backend re-emit the Save/Cancel pair of every surviving pending onto the new message,
        // so the same pair can sit under two messages at once. Answering it retires all of its
        // copies — otherwise the leftover one stays clickable on a file that is already decided.
        const clickedMessageId = extra && extra.messageId;
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (clickedTempRef) {
              const offersTempRef = (msg.messageData?.actions || []).some(a => fileSaveActionTempRef(a && a.id) === clickedTempRef);
              const resolved = msg.messageData?.resolvedFileTempRefs || [];
              if (!offersTempRef || resolved.includes(clickedTempRef)) {
                return msg;
              }
              return { ...msg, messageData: { ...msg.messageData, resolvedFileTempRefs: [...resolved, clickedTempRef] } };
            }
            const isClicked = clickedMessageId
              ? msg.id === clickedMessageId
              : !msg.messageData?.actionsResolved && msg.messageData?.actions?.some(a => a.id === actionId);
            if (!isClicked) {
              return msg;
            }
            // The deploy scope this gate was answered with is recorded next to the flag rather
            // than kept in `DeployConfirmation`, whose state is destroyed every time the chat
            // window is minimized — a resolved card must keep reporting the scope that was sent.
            const sentDeployScope = extra && extra.deployScopeOption;
            return {
              ...msg,
              messageData: { ...msg.messageData, actionsResolved: true, ...(sentDeployScope && { sentDeployScope }) }
            };
          })
        );

        startPolling(requestId);

        // The progress card of a file-save click is a notice about that file, exactly like the
        // answer it will be replaced by (`handlePollingResult` stamps the same flag). Without it
        // the card counts as a newer message for the whole round trip, and `isGateStale` reports
        // the gate merged into the same mixed set as no longer live — the plan hint blinks away and
        // a deploy card reverts to reporting a decision it has not taken.
        const processingMessage = buildInitialProcessingMessage(data);
        setMessages(prevMessages => [
          ...prevMessages,
          clickedTempRef ? { ...processingMessage, isFileActionNotice: true } : processingMessage
        ]);
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

  // The scope a deploy card is currently set to send, recorded on the message as soon as the user
  // picks it. It lives here and not in `DeployConfirmation`'s own state for the same reason
  // `sentDeployScope` does: minimizing the chat unmounts the whole message list
  // (`AIAssistantChat.jsx`: `{!isMinimized && …}`), and a selection kept in component state is
  // silently reverted to the backend's default on restore — the next confirm would then deploy to a
  // scope the user had explicitly changed away from.
  const selectDeployScope = useCallback((messageId, scopeKey) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => (msg.id === messageId ? { ...msg, messageData: { ...msg.messageData, draftDeployScopeKey: scopeKey } } : msg))
    );
  }, []);

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
    selectDeployScope,
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
