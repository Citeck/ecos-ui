import Records from '@citeck/records-core';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import editorContextService from '../EditorContextService';
import { loadSession, saveSession, clearActiveRequestId, clearSession, markRequestCompleted } from '../chatSessionStorage';
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
import { generateUUID, fileSaveActionTempRef, isSameRecordRef } from '../utils';

import usePolling from './usePolling';

import { t } from '@/helpers/export/util';
import { getWorkspaceId } from '@/helpers/urls';
import { NotificationManager } from '@/services/notifications';

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
 * @param {boolean} options.isOpen - Whether the assistant panel is open (drives request restoration)
 * @returns {Object} Universal chat state and handlers
 */
const useUniversalChat = (options = {}) => {
  const {
    additionalContext = { records: [], documents: [], attributes: [] },
    uploadedFiles = [],
    clearUploadedFiles,
    clearAllContext,
    isOpen = false
  } = options;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // What the previous life of this page left behind, read exactly once. Everything restored from it
  // describes one and the same conversation, so it must come from one and the same reading: a
  // second `loadSession()` further down could already see a record another tab or a finished
  // request has rewritten, and the chat would come up bound to one conversation but labelled with
  // the agent of another.
  const [restoredSession] = useState(loadSession);
  // The conversation is server-side and outlives the page, so a reload must not silently start a
  // new one (D-B-14): a stored id lets the next question continue the same conversation. Reading
  // the storage here is free of side effects and independent of whether the panel is open — the
  // request that may still be running is picked up separately, when the panel is opened.
  const [conversationId, setConversationId] = useState(() => restoredSession?.conversationId || generateUUID());
  const [conversationForceIntent, setConversationForceIntent] = useState(null);
  const [activeBusinessAppProgress, setActiveBusinessAppProgress] = useState(null);
  const [generationStages, setGenerationStages] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [autoContextArtifacts, setAutoContextArtifacts] = useState([]);
  // The state above keeps every artifact the backend has sent; what the chips, the `@` list and the
  // outgoing request see is this sifted view. The sift is computed, not written into the state,
  // because a record enters and leaves the manual context by itself as its page is opened and left
  // (`syncCurrentRecord`, useAdditionalContext.js): erasing the artifact on the way in would make
  // that visit an irreversible loss, while a computed view hides it for the duration and gives it
  // back afterwards. Documents are sifted alongside records — they reach the backend through
  // `selection.documents`, so a matching artifact would send the same entity twice in one request.
  // Removal by hand is the one case the sift must not undo, and it does not go through here: the
  // chip's `×` drops both halves at once (`handleToggleContext` in AIAssistantChat).
  const visibleAutoContextArtifacts = useMemo(() => {
    const manual = [...(additionalContext?.records || []), ...(additionalContext?.documents || [])];
    if (!manual.length || !autoContextArtifacts.length) {
      return autoContextArtifacts;
    }
    // `isSameRecordRef`, not `===`: manual entries carry the ref as their source wrote it
    // (`emodel/type@id` from the page address, `type@id` from a search result) while the backend
    // returns its own form — a strict comparison would miss the very entry the sift is written for.
    const next = autoContextArtifacts.filter(a => !manual.some(m => isSameRecordRef(m.recordRef, a.ref)));
    // Keep the previous array identity when nothing is removed, so consumers do not re-render
    // over a fresh-but-equal array on every pass.
    return next.length === autoContextArtifacts.length ? autoContextArtifacts : next;
  }, [autoContextArtifacts, additionalContext?.records, additionalContext?.documents]);
  // Restored together with the conversation, and for the conversation's sake: the binding lives on
  // the server (`AgentOrchestratorService.resolveAgentRef` in citeck-ai answers from the `AGENT_REF`
  // stored on the conversation whenever a question does not carry one), so a chip reset to
  // "Citeck AI" would not switch anything back — it would only stop telling the truth, and the user
  // would go on being answered by the specialised agent they cannot see any more.
  const [selectedAgent, setSelectedAgent] = useState(() => restoredSession?.agent || null);

  // Whether the conversation on screen may hold a dialog the message list does not show. The list is
  // deliberately not restored (decision 1 in the plan), so after a reload it starts empty while the
  // conversation behind it — its history, its agent binding, possibly a request still running — is
  // very much alive server-side. Anything asking "is there a dialog worth confirming the loss of"
  // has to count that hidden history: switching agents deletes the conversation, and judged by the
  // empty list alone it would do so without asking.
  const [hasRestoredConversation, setHasRestoredConversation] = useState(() => !!restoredSession?.conversationId);

  // tempRef of the pending file whose save/cancel is currently in flight. Set when a file-save
  // action is clicked, consumed by handlePollingResult to drop the dead preview once the temp
  // file is gone, and cleared on any terminal/non-file flow so it never triggers a stale strip.
  const pendingFileActionTempRef = useRef(null);

  // Bumped every time "clear chat" resets the conversation. `resetConversationState` can only stop a
  // poll that has already started; a turn whose POST is still in flight at that moment is not
  // covered, and when it resolves it would write the just-deleted `conversationId` back into
  // sessionStorage, start polling into the emptied chat and pin `isLoading` on it — the chat would
  // come back from the next reload bound to a conversation the backend no longer has (D-B-14).
  const conversationGenerationRef = useRef(0);

  // Single place to forget the in-flight tracked tempRef. Every terminal/non-file flow calls
  // this instead of re-stating the assignment, so a newly added terminal path can't silently
  // skip the clear and leave a stale tempRef that would strip a still-live preview.
  const clearPendingFileAction = useCallback(() => {
    pendingFileActionTempRef.current = null;
  }, []);

  // Guards the request restoration (the effect further down) against every repeat: React StrictMode
  // runs mount effects twice in development, and reopening the panel while the restored request is
  // still being polled would resume it a second time. A ref, not state — it must be readable
  // synchronously inside the very effect run that sets it. It is lowered again when a poll gives up
  // on a request that may still be running, so that reopening the panel picks that request back up.
  const isRequestRestoredRef = useRef(false);

  // The panel state as the restore effect last saw it, so that the effect can tell an opening from
  // one of its own re-runs.
  const wasPanelOpenRef = useRef(false);

  // Fetch status function for polling
  const fetchStatus = useCallback(async requestId => {
    const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_STATUS}/${encodeURIComponent(requestId)}`);
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
      // The request is over — marked finished, not forgotten. Forgetting it made a reload lose more
      // than the answer: a turn may end on a gate the backend is still holding (`PENDING_DEPLOY`
      // and every other HITL card), and with the id gone there was no way left to bring that card
      // back — the server went on waiting while the chat showed an empty screen with nothing to
      // answer with. Kept and marked, the id is fetched once on the next opening and the card is
      // laid out again; nothing is polled, because there is nothing left to poll (D-B-14).
      markRequestCompleted();

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
        // Stored as delivered: the sift against the manual context is `visibleAutoContextArtifacts`,
        // computed on the way out. Filtering here as well would re-introduce the second mechanism —
        // one that runs only at this moment and rewrites the stored state irreversibly.
        setAutoContextArtifacts(result.contextArtifacts);
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
    [generationStages, clearPendingFileAction]
  );

  // Handle polling error
  const handlePollingError = useCallback(
    (error, meta = {}) => {
      setIsLoading(false);
      // Only a failure of the REQUEST retires its id. `meta.requestAlive` marks the other kind — the
      // polling gave up (watchdog, dropped connection, gateway error page) while the request behind
      // it was never reported finished — and there the id is kept, so that a reload or a reopening
      // of the panel can still collect the answer within `CHAT_REQUEST_RESUME_TTL_MS` (D-B-14). The
      // terminal cases clear it: a backend-reported failure, and `meta.requestLost` (the 404 from
      // `fetchStatus` — an id that would only fetch another 404). The conversation survives either
      // way, so the next question continues it.
      if (meta.requestAlive) {
        // The restore below is latched for the whole life of the page, so without lowering it the
        // only way back to the answer was a full reload: closing and reopening the panel, the
        // obvious thing to try, did nothing. Nothing is polling here (`finishPolling` ran), so this
        // cannot duplicate a live poll.
        isRequestRestoredRef.current = false;
        // The tracked tempRef is kept for the same span and the same reason: what is being resumed
        // is the answer to a file-save click, and only this ref says so. Cleared here, that answer
        // arrived untagged — retiring the sibling gate the backend is still waiting on and dropping
        // an agent status it never spoke about. Every path that could consume it next overwrites it
        // first, so holding it costs nothing.
      } else {
        clearActiveRequestId();
        // A terminal failure ends the request itself, so nothing will ever come back to consume the
        // tempRef — forget it, or it would strip a still-live preview out of some later result.
        clearPendingFileAction();
      }
      // Nothing is running after a failed turn, so the stage indicator and the agent status have to
      // go or they keep announcing progress for a dead request (D-B-7). `generationStages` goes with
      // them: while it is set the three `!generationStages` guards refuse the stage list of the NEXT
      // request, and a failed generation would leave its timeline on top of an unrelated one.
      setActiveBusinessAppProgress(null);
      setAgentStatus(null);
      setGenerationStages(null);
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.isProcessing) {
            const reason = meta.requestLost
              ? t('ai-assistant.chat.request-lost')
              : typeof error === 'string'
                ? t('ai-assistant.chat.error-prefix', { error })
                : t('ai-assistant.chat.result-error');
            // The card is the only place the kept id is ever mentioned. Without the hint the user
            // does the obvious thing — asks again — and that overwrites the stored id
            // (`handleSubmit` → `saveSession`), putting the answer out of reach for good.
            const text = meta.requestAlive ? `${reason} ${t('ai-assistant.chat.request-resumable-hint')}` : reason;

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
    clearActiveRequestId();
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

  // D-B-14: a request started before a page reload keeps running on the server, but the page that
  // could collect its result is gone. The pair saved in sessionStorage is the only way back to it.
  //
  // The trigger is the panel being opened, not the hook mounting: `AIAssistantContainer` renders on
  // every page of the application, so a mount-bound effect would poll for up to ten minutes on
  // pages where the user never opened the chat, and would drop the answer into a chat whose form
  // context belongs to a different record by then. After a reload the panel is always closed
  // (`AIAssistantService`), so the user opens it themselves — that is the natural moment to resume.
  useEffect(() => {
    // Only an actual close→open transition may resume anything. The effect re-runs whenever its
    // dependencies change, and since the latch below comes down again on a poll that gave up, a
    // plain `isOpen` check would let such a re-run restart the very request that had just failed —
    // over and over, with the panel simply left open. A user action is the one trigger there is.
    const justOpened = isOpen && !wasPanelOpenRef.current;
    wasPanelOpenRef.current = isOpen;

    // A turn that is already under way needs no rescuing, and restoring on top of one appends a
    // second processing card and calls `startPolling` again — which bumps the generation in
    // `usePolling`, killing the poll in flight and restarting it with the watchdog back at zero.
    // `activeRequestId` covers the polling half, `isLoading` the half before it: `startPolling` runs
    // only once `POST /universal/async` has answered, and both handlers raise `isLoading` before
    // their first await, so a turn still travelling to the backend is covered too. The latch stays
    // down here on purpose — nothing was restored, and the record is read again on the next opening.
    if (!justOpened || isRequestRestoredRef.current || activeRequestId || isLoading) {
      return;
    }

    // Set before anything else, so the second StrictMode run is turned away here and not after a
    // duplicate card and a second `startPolling` have already happened.
    isRequestRestoredRef.current = true;

    // `loadSession` validates the record and drops it itself when it is malformed, foreign or past
    // `CHAT_SESSION_TTL_MS`. A request past the shorter resume window is not dropped — the
    // conversation around it is still good — but it is reported as `requestId: null`, so it is
    // turned away by the check below exactly like a record that never had one.
    const session = loadSession();
    if (!session?.requestId) {
      return;
    }

    // A finished turn is not resumed, it is collected. Its answer — and the gate it may have left
    // the dialog on — is already on the server, kept for an hour and handed back by the same id, so
    // one request is enough and there is nothing to poll: no processing card, no `startPolling`, no
    // watchdog. The result goes through the ordinary handler, so a restored gate is built by exactly
    // the same code that built it the first time (D-B-14).
    if (session.requestCompleted) {
      fetchStatus(session.requestId)
        .then(data => {
          if (data?.result) {
            handlePollingResult(data.result);
          }
        })
        .catch(error => {
          // The hour is up, or the service was restarted — the result is gone and there is nothing
          // to show. That is an ordinary end for a finished turn, not a failure worth a word: the
          // user asked for nothing here, the panel merely opened.
          if (!error?.requestLost) {
            console.error('Error restoring the finished request:', error);
          }
        });
      return;
    }

    // Mandatory, not cosmetic: without it the input stays unlocked, the user sends a second
    // question, `startPolling` bumps the generation token (`usePolling.js`) and the restored poll
    // dies silently while its card keeps spinning.
    setIsLoading(true);
    // The server sent no initial progress this time around — the generic processing card is exactly
    // what an unknown-shape response produces on the normal path as well. It is stamped by the same
    // rule `handleActionClick` uses for its own card: a kept `pendingFileActionTempRef` says the turn
    // being resumed is the answer to a file-save click, and an unstamped card would count as a step
    // of the dialog for `isSupersededByNewerMessage` — retiring the sibling gate of the Save/Cancel
    // pair the backend is still waiting on, for the whole duration of the resumed poll.
    const resumedProcessingMessage = buildInitialProcessingMessage({});
    setMessages(prevMessages => [
      ...prevMessages,
      pendingFileActionTempRef.current ? { ...resumedProcessingMessage, isFileActionNotice: true } : resumedProcessingMessage
    ]);
    startPolling(session.requestId);
  }, [isOpen, startPolling, activeRequestId, isLoading, fetchStatus, handlePollingResult]);

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

      // The conversation this turn belongs to. Nothing disables the clear button while a request is
      // being sent, so by the time the POST resolves the chat may already have been emptied.
      const conversationGeneration = conversationGenerationRef.current;

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

        // The sift in `visibleAutoContextArtifacts` is computed from the manual context alone, and by
        // this point `selection.records` may hold more than that: the block above adds the parent
        // record of every manual document when no record was picked by hand. Such a parent is in no
        // collection the memo can see, so an artifact for it would travel in `contextArtifacts` while
        // the same record travels in `selection.records` — one entity through two channels, which is
        // exactly what decision 8 of the plan forbids. Sift once more against what is being sent.
        const artifactsToSend = visibleAutoContextArtifacts.filter(
          artifact => !selectionData.records.some(record => isSameRecordRef(record.recordRef, artifact.ref))
        );

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
            ...(artifactsToSend.length > 0 && { contextArtifacts: artifactsToSend }),
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

        // The chat was cleared while this turn was being sent: the conversation it belongs to is
        // gone server-side, so its answer has nowhere to land. Everything below would write it into
        // the fresh conversation instead — the storage record first of all, which is what the next
        // reload restores. Leave the request alone; deleting the conversation retires it there.
        if (conversationGeneration !== conversationGenerationRef.current) {
          return;
        }

        if (data.initialProgress?.availableStages) {
          setGenerationStages(data.initialProgress.availableStages);
        }

        // From here on the request lives on the server and the only thing tying the page to it is
        // this pair. Persist it before polling starts, so a reload one tick later still finds it.
        // The agent goes with it: this question is what binds the conversation to it server-side,
        // so from now on a reload that restored the conversation without it would mislabel the chip.
        saveSession(conversationId, requestId, selectedAgent);

        startPolling(requestId);

        const processingMessage = buildInitialProcessingMessage(data);

        setMessages(prevMessages => [...prevMessages, processingMessage]);
      } catch (error) {
        console.error('Error in universal chat:', error);

        // The chat was cleared meanwhile — the message this failure belongs to is no longer on
        // screen, and an error notice about it would appear out of nowhere in the emptied chat.
        if (conversationGeneration !== conversationGenerationRef.current) {
          return;
        }

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
      visibleAutoContextArtifacts,
      selectedAgent,
      startPolling,
      clearPendingFileAction
    ]
  );

  // Cancel active request
  const cancelRequest = useCallback(async () => {
    if (!activeRequestId) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_STATUS}/${encodeURIComponent(activeRequestId)}`, {
        method: 'DELETE'
      });

      // A 404 means the backend no longer holds this request — it was dropped by a service restart
      // or retired once its result had been kept long enough. There is nothing left to cancel, so
      // the local cancellation runs exactly as on a confirmed one: the same rule as for the
      // conversation DELETE behind "clear chat". Reported as a failure instead, it produced two
      // contradictory messages for one click — «не удалось отменить» from here, and «запрос
      // потерян» a second later when the poll met the same 404 — and left the card spinning with a
      // request id that could never be resumed.
      if (!response.ok && response.status !== 404) {
        console.error(`Error cancelling request: ${response.status}`);
        // The request goes on running and its card goes on spinning, so silence here reads as a
        // broken button: nothing on screen changes and the only trace is a console line. Same rule
        // as for the refused DELETE behind "clear chat" — say that the cancellation was refused.
        NotificationManager.error(
          t('ai-assistant.notification.cancel-request-error-status', { status: response.status }),
          t('ai-assistant.notification.cancel-request-error-title')
        );
        return;
      }

      // Only once the request is known to be over — confirmed cancelled, or gone from the backend
      // altogether. On a refused cancellation it is still running and its result still has to be
      // recognised as the answer to the file-save click that started it, or `handlePollingResult`
      // would strip a live preview and clear an `agentStatus` that answer never spoke about.
      clearPendingFileAction();

      stopPolling();

      // Same condition: on a refused DELETE the request is still running there, and dropping the id
      // would strand it for good. A 404 has nothing to strand.
      clearActiveRequestId();

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
      NotificationManager.error(
        t('ai-assistant.notification.cancel-request-error'),
        t('ai-assistant.notification.cancel-request-error-title')
      );
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

      // Same race as in `handleSubmit`: the clear button stays live while the action is being sent.
      const conversationGeneration = conversationGenerationRef.current;

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

        // The chat was cleared while the action was in flight: the conversation that held this gate
        // no longer exists, so neither the storage record nor the resolved-gate marks below have
        // anything to apply to.
        if (conversationGeneration !== conversationGenerationRef.current) {
          // Terminal path like any other: the tracked tempRef belongs to the discarded conversation,
          // and left behind it would be consumed by the first result of the fresh one — stamping it
          // `isFileActionNotice` and keeping an `agentStatus` that answer never spoke about.
          clearPendingFileAction();
          return;
        }

        // An action starts a request exactly like a free-text turn does, so it is persisted the
        // same way — a reload during a long deploy confirmation must not lose its result (D-B-14).
        // The agent is written along with it for the same reason as in `handleSubmit`: whatever the
        // record says about the conversation has to keep saying who is answering in it.
        saveSession(conversationId, requestId, selectedAgent);

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

        // The chat was cleared meanwhile: the card this action belonged to is gone, so its error
        // notice would surface alone in an emptied chat.
        if (conversationGeneration !== conversationGenerationRef.current) {
          return;
        }

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
    [conversationId, selectedAgent, startPolling, clearPendingFileAction]
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

  // Remove a single auto context artifact by ref.
  // `isSameRecordRef`, not `===`: the caller is not always the artifact's own chip. Removing a record
  // from the manual context takes the artifact hidden behind it away too (`handleToggleContext` in
  // AIAssistantChat), and there the reference comes from the manual entry — written as its own source
  // wrote it, with or without the application prefix — while the artifact carries the backend's form.
  const removeAutoContextArtifact = useCallback(ref => {
    setAutoContextArtifacts(prev => {
      const next = prev.filter(a => !isSameRecordRef(a.ref, ref));
      return next.length === prev.length ? prev : next;
    });
  }, []);

  // Everything the "clear chat" button resets on this side. Kept together so that the storage
  // record and the id held in memory are always rewritten in the same breath — a wiped record next
  // to a live old id, or the reverse, is what makes the chat unrecoverable across a reload (D-B-14).
  const resetConversationState = useCallback(() => {
    // Nothing disables the clear button while a request runs, so the poll of that request is
    // very much alive at this point. Left running it would deliver its answer into the chat the
    // user has just emptied, and `isLoading` would keep the input blocked until it did.
    stopPolling();
    // A request that has been sent but not yet answered by `POST /universal/async` has no poll to
    // stop yet, so it needs the token instead: `handleSubmit`/`handleActionClick` check it before
    // touching anything that belongs to the conversation being replaced here.
    conversationGenerationRef.current++;
    // A terminal path like every other, and the reason this call is not inlined anywhere: the file
    // whose save was in flight belongs to the conversation being discarded here. `stopPolling` sees
    // to it that no result of that request ever reaches `handlePollingResult`, so nothing would
    // consume the tracked tempRef — and the first answer of the *fresh* conversation would be read
    // as the reply to that save: stamped `isFileActionNotice`, its `agentStatus` left standing, and
    // the dead tempRef free to strip an image out of a message it has nothing to do with.
    clearPendingFileAction();
    setIsLoading(false);
    setMessages([]);
    setConversationId(generateUUID());
    // The new conversation is empty on both sides now — nothing is hidden behind the empty list any
    // more, so the next agent switch is judged by the messages alone, as it is before any reload.
    setHasRestoredConversation(false);
    clearSession();
    setConversationForceIntent(null);
    setActiveBusinessAppProgress(null);
    setGenerationStages(null);
    setAgentStatus(null);
    setAutoContextArtifacts([]);

    clearAllContext?.();
    clearUploadedFiles?.();

    editorContextService.clearContext();
  }, [stopPolling, clearAllContext, clearUploadedFiles, clearPendingFileAction]);

  // The clear that is currently in flight, if any. Nothing disables the button while its DELETE
  // travels, so a double click used to send two of them: the second one answers 404 — the
  // conversation is already gone — which this handler rightly reads as success, and the whole reset
  // ran a second time. A question asked between the two responses was wiped by that second reset,
  // its still-in-flight POST discarded by the generation token, and the chat left bound to a
  // conversation id the question never went to.
  const pendingClearRef = useRef(null);

  // Clear conversation.
  // Reports whether the local reset actually ran: the caller resets context of its own next to this
  // call (the script-context chip in `AIAssistantChat`), and on a refused DELETE the conversation is
  // still alive server-side — dropping that context anyway would contradict the error notification
  // below and silently unbind a script the chat goes on sending with the next question.
  // @returns {Promise<boolean>} True when the conversation was cleared
  const runClearConversation = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_CONVERSATION}/${encodeURIComponent(conversationId)}`, {
        method: 'DELETE'
      });

      // A 404 means the backend no longer holds this conversation — it was retired by expiry, lost
      // to a service restart, or refused by `ConversationOwnerGuard`. The local reset has to run
      // anyway: since D-B-14 the `conversationId` survives a reload, so a stale id is restored on
      // every reload of the tab and a button that quietly did nothing would leave the chat wedged
      // for good, with no way out from the interface. Before the persistence a reload minted a
      // fresh id and healed this by itself.
      if (response.ok || response.status === 404) {
        resetConversationState();
        return true;
      }

      // Any other refusal leaves the conversation alive server-side, so the state is kept as is —
      // but the user has to be told, or the button reads as broken. Its own key, not the
      // `chat.http-error` fragment: that one is lowercase wording built to sit after
      // `chat.error-prefix` inside a message bubble, and as a notification body it reads as a
      // truncated sentence that never says what failed.
      NotificationManager.error(
        t('ai-assistant.notification.clear-chat-error-status', { status: response.status }),
        t('ai-assistant.notification.clear-chat-error-title')
      );
      return false;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      NotificationManager.error(t('ai-assistant.notification.clear-chat-error'), t('ai-assistant.notification.clear-chat-error-title'));
      return false;
    }
  }, [conversationId, resetConversationState]);

  // A second call made while the first is still travelling joins it instead of sending its own
  // DELETE: one request, one reset, and both callers still learn the true outcome. Refusing the
  // second one with `false` would be a lie the callers act on — the agent selector reverts the
  // agent the user picked whenever the clearing reports failure.
  const clearConversation = useCallback(() => {
    if (pendingClearRef.current) {
      return pendingClearRef.current;
    }

    const pending = runClearConversation().finally(() => {
      pendingClearRef.current = null;
    });
    pendingClearRef.current = pending;

    return pending;
  }, [runClearConversation]);

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
    // The computed view, under the state's historical name: every consumer — the chips, the `@`
    // list — keeps working unchanged, while the full state stays internal. The raw setter is
    // deliberately not handed out next to it: written through, it would be read back filtered, and
    // an entity dropped by the sift would look like a write that silently did nothing. The only
    // writer is the response the server sends (`onResult`), which is where the artifacts come from.
    autoContextArtifacts: visibleAutoContextArtifacts,
    selectedAgent,
    hasRestoredConversation,

    // Setters
    setMessage,
    setMessages,
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
