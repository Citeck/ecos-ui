import { useState, useCallback } from 'react';
import { getWorkspaceId } from '@/helpers/urls';
import Records from '../../Records';
import editorContextService from '../EditorContextService';
import {
  AI_INTENTS,
  MESSAGE_TYPES,
  EDITOR_CONTEXT_HANDLERS,
  API_ENDPOINTS, CONTENT_TYPES
} from "../constants";
import { generateUUID } from '../utils';
import usePolling from './usePolling';

/**
 * Creates an AI message object based on response data
 * @param {Object} responseData - Response data from API
 * @param {Object} options - Additional options
 * @returns {Object} Message object
 */
const createAIMessage = (responseData, options = {}) => {
  const { setGenerationStages, generationStages } = options;
  const messageData = responseData.message;
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
      text: messageData.description || 'Предлагаемые изменения:',
      sender: 'ai',
      timestamp: new Date(),
      isTextDiffContent: true,
      messageData: messageData
    };
  }

  if (isScriptDiffMessage) {
    return {
      id: generateUUID(),
      text: messageData.explanation || 'Предлагаемые изменения скрипта:',
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
      text: messageData.message || 'Обрабатывается запрос...',
      sender: 'ai',
      timestamp: new Date(),
      isBusinessAppContent: true,
      messageData: messageData
    };
  }

  // Default text message
  return {
    id: generateUUID(),
    text: messageData || 'Не удалось получить ответ.',
    sender: 'ai',
    timestamp: new Date()
  };
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

  // Fetch status function for polling
  const fetchStatus = useCallback(async (requestId) => {
    const response = await fetch(`${API_ENDPOINTS.UNIVERSAL_STATUS}/${requestId}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  }, []);

  // Handle polling result
  const handlePollingResult = useCallback((result) => {
    setIsLoading(false);

    if (result.forceIntent) {
      setConversationForceIntent(result.forceIntent);
    }

    const isBusinessAppCompleted = typeof result.message === 'object' &&
      result.message?.type === MESSAGE_TYPES.BUSINESS_APP_GENERATION &&
      result.message?.stage === 'COMPLETED';

    if (isBusinessAppCompleted) {
      setTimeout(() => {
        setActiveBusinessAppProgress(null);
        setGenerationStages(null);
      }, 5000);
    }

    setMessages(prevMessages => {
      const filteredMessages = prevMessages.filter(msg => !msg.isProcessing);
      const aiMessage = createAIMessage(result, { setGenerationStages, generationStages });
      return [...filteredMessages, aiMessage];
    });
  }, [generationStages]);

  // Handle polling error
  const handlePollingError = useCallback((error) => {
    setIsLoading(false);
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.isProcessing) {
          return {
            ...msg,
            text: typeof error === 'string'
              ? `Ошибка: ${error}`
              : 'Произошла ошибка при получении результата. Пожалуйста, попробуйте снова.',
            isProcessing: false,
            isError: true
          };
        }
        return msg;
      })
    );
  }, []);

  // Handle polling cancelled
  const handlePollingCancelled = useCallback(() => {
    setIsLoading(false);
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.isProcessing) {
          return {
            ...msg,
            text: 'Запрос был отменен.',
            isProcessing: false,
            isCancelled: true
          };
        }
        return msg;
      })
    );
  }, []);

  // Handle polling progress
  const handlePollingProgress = useCallback((progress) => {
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

    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.isProcessing) {
          return {
            ...msg,
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
          };
        }
        return msg;
      })
    );
  }, [generationStages]);

  // Use polling hook
  const {
    startPolling,
    stopPolling,
    activeRequestId
  } = usePolling({
    fetchStatus,
    onResult: handlePollingResult,
    onError: handlePollingError,
    onCancelled: handlePollingCancelled,
    onProgress: handlePollingProgress
  });

  // Handle submit
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!message.trim()) return;

    const userMessage = { id: generateUUID(), text: message, sender: 'user', timestamp: new Date() };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    const messageToProcess = message;
    setMessage('');
    setIsLoading(true);

    try {
      const contextToSend = {
        records: additionalContext.records ? Object.values(additionalContext.records) : [],
        documents: additionalContext.documents ? Object.values(additionalContext.documents) : [],
        attributes: additionalContext.attributes ? Object.values(additionalContext.attributes) : [],
        selectedTexts: additionalContext.selectedTexts || []
      };

      // Auto-include parent records from documents
      if (contextToSend.documents.length > 0 && contextToSend.records.length === 0) {
        const parentRefs = contextToSend.documents
          .map(doc => doc.parentRef)
          .filter(parentRef => parentRef);

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

      const requestData = {
        message: messageToProcess,
        conversationId: conversationId,
        context: {
          workspace: getWorkspaceId(),
          selection: selectionData,
          content: contentData,
          forceIntent: forceIntent,
          ...(editing && { editing })
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
        throw new Error('Не удалось получить ID запроса');
      }

      if (data.initialProgress?.availableStages) {
        setGenerationStages(data.initialProgress.availableStages);
      }

      startPolling(requestId);

      let processingMessage;
      if (data.detectedIntent === 'BUSINESS_APP_GENERATION' && data.initialProgress) {
        processingMessage = {
          id: generateUUID(),
          sender: 'ai',
          timestamp: new Date(),
          isProcessing: true,
          pollingIsUsed: true,
          isBusinessAppContent: true,
          messageData: {
            type: MESSAGE_TYPES.BUSINESS_APP_GENERATION,
            stage: data.initialProgress.stage,
            progress: data.initialProgress.progress,
            message: data.initialProgress.message
          }
        };
      } else {
        processingMessage = {
          id: generateUUID(),
          text: 'Запрос обрабатывается. Это может занять некоторое время...',
          sender: 'ai',
          timestamp: new Date(),
          isProcessing: true,
          pollingIsUsed: true
        };
      }

      setMessages(prevMessages => [...prevMessages, processingMessage]);

    } catch (error) {
      console.error('Error in universal chat:', error);

      setMessages(prevMessages => [...prevMessages, {
        id: generateUUID(),
        text: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      }]);

      setIsLoading(false);
    }
  }, [message, conversationId, additionalContext, uploadedFiles, conversationForceIntent, startPolling]);

  // Cancel active request
  const cancelRequest = useCallback(async () => {
    if (!activeRequestId) return;

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
              text: 'Запрос был отменен.',
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
  }, [activeRequestId, stopPolling]);

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

    // Setters
    setMessage,
    setMessages,

    // Actions
    handleSubmit,
    cancelRequest,
    clearConversation
  };
};

export default useUniversalChat;
