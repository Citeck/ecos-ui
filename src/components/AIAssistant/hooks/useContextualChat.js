import { useState, useCallback } from 'react';
import aiAssistantService from '../AIAssistantService';
import editorContextService, { CONTEXT_TYPES } from '../EditorContextService';
import { API_ENDPOINTS } from '../constants';
import { generateUUID } from '../utils';
import usePolling from './usePolling';

/**
 * Hook for managing contextual chat functionality (BPMN, etc.)
 * @param {Object} options - Configuration options
 * @param {string} options.contextType - Current context type
 * @returns {Object} Contextual chat state and handlers
 */
const useContextualChat = (options = {}) => {
  const { contextType } = options;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => generateUUID());

  // Fetch status function for polling
  const fetchStatus = useCallback(async (requestId) => {
    const response = await fetch(`${API_ENDPOINTS.BPMN_STATUS}/${requestId}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  }, []);

  // Handle polling result
  const handlePollingResult = useCallback((result) => {
    setIsLoading(false);

    if (result && contextType === CONTEXT_TYPES.BPMN_EDITOR) {
      if (result.type === 'TEXT') {
        // Text answer — display as markdown message in chat
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.isProcessing) {
              return {
                id: msg.id || generateUUID(),
                text: result.text || 'Не удалось получить ответ.',
                sender: 'ai',
                timestamp: new Date()
              };
            }
            return msg;
          })
        );
      } else if (result.type === 'BPMN' && result.bpmnXml) {
        // BPMN XML — load into editor
        aiAssistantService.handleSubmit(result.bpmnXml);

        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.isProcessing) {
              return {
                id: msg.id || generateUUID(),
                text: 'Процесс успешно создан и загружен в редактор.',
                sender: 'ai',
                timestamp: new Date()
              };
            }
            return msg;
          })
        );
      } else {
        // Unknown or malformed result type
        console.error('Unexpected BPMN result format:', result);
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.isProcessing) {
              return {
                ...msg,
                text: 'Получен неожиданный формат ответа.',
                isProcessing: false,
                isError: true
              };
            }
            return msg;
          })
        );
      }
    }
  }, [contextType]);

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

  // Use polling hook
  const {
    startPolling,
    stopPolling,
    activeRequestId
  } = usePolling({
    fetchStatus,
    onResult: handlePollingResult,
    onError: handlePollingError,
    onCancelled: handlePollingCancelled
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

    // Get current context data
    const contextData = editorContextService.getContextData();

    try {
      const response = await fetch(API_ENDPOINTS.BPMN_ASYNC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToProcess,
          conversationId: conversationId,
          context: {
            type: contextType,
            ...contextData
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const requestId = data.requestId;

      if (!requestId) {
        throw new Error('Не удалось получить ID запроса');
      }

      startPolling(requestId);

      const processingMessage = {
        id: generateUUID(),
        text: 'Запрос обрабатывается...',
        sender: 'ai',
        timestamp: new Date(),
        isProcessing: true,
        pollingIsUsed: true
      };

      setMessages(prevMessages => [...prevMessages, processingMessage]);

    } catch (error) {
      console.error('Error in contextual chat:', error);

      setMessages(prevMessages => [...prevMessages, {
        id: generateUUID(),
        text: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      }]);

      setIsLoading(false);
    }
  }, [message, contextType, conversationId, startPolling]);

  // Cancel active request
  const cancelRequest = useCallback(async () => {
    if (!activeRequestId) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.BPMN_STATUS}/${activeRequestId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.error(`Error cancelling request: ${response.status}`);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    } finally {
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
    }
  }, [activeRequestId, stopPolling]);

  // Clear messages and conversation memory
  const clearMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BPMN_CONVERSATION}/${conversationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages([]);
        setConversationId(generateUUID());
      }
    } catch (error) {
      console.error('Error clearing BPMN conversation:', error);
    }
  }, [conversationId]);

  return {
    // State
    message,
    messages,
    isLoading,
    activeRequestId,
    conversationId,

    // Setters
    setMessage,
    setMessages,

    // Actions
    handleSubmit,
    cancelRequest,
    clearMessages
  };
};

export default useContextualChat;
