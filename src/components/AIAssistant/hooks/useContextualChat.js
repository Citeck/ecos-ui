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
      aiAssistantService.handleSubmit(result);
    }

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
  }, [message, contextType, startPolling]);

  // Cancel active request
  const cancelRequest = useCallback(async () => {
    if (!activeRequestId) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.BPMN_STATUS}/${activeRequestId}`, {
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

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    // State
    message,
    messages,
    isLoading,
    activeRequestId,

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
