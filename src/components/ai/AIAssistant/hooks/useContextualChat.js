import { useState, useCallback } from 'react';

import aiAssistantService from '../AIAssistantService';
import editorContextService, { CONTEXT_TYPES } from '../EditorContextService';
import { generateUUID } from '../utils';

import { fetchAiStatus } from '../aiRequestPolling';
import usePolling from './usePolling';

import { API_ENDPOINTS, BPMN_AI_REQUEST_WAIT_MS } from '@/components/ai/AIAssistant/constants';
import { t } from '@/helpers/export/util';

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

  // Fetch status function for polling. The BPMN assistant answers a failed or timed-out request
  // with a 500 whose body carries the reason; `fetchAiStatus` hands that reason over as the
  // request's verdict instead of the "Error: 500" this used to show, and cuts off a hung GET.
  const fetchStatus = useCallback(requestId => fetchAiStatus(`${API_ENDPOINTS.BPMN_STATUS}/${encodeURIComponent(requestId)}`), []);

  // Handle polling result
  const handlePollingResult = useCallback(
    result => {
      setIsLoading(false);

      if (result && contextType === CONTEXT_TYPES.BPMN_EDITOR) {
        if (result.type === 'TEXT') {
          // Text answer — display as markdown message in chat
          setMessages(prevMessages =>
            prevMessages.map(msg => {
              if (msg.isProcessing) {
                return {
                  id: msg.id || generateUUID(),
                  text: result.text || t('ai-assistant.chat.no-response'),
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
                  text: t('ai-assistant.chat.bpmn-created'),
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
                  text: t('ai-assistant.chat.unexpected-format'),
                  isProcessing: false,
                  isError: true
                };
              }
              return msg;
            })
          );
        }
      }
    },
    [contextType]
  );

  // Handle polling error
  const handlePollingError = useCallback(error => {
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
  }, []);

  // Handle polling cancelled
  const handlePollingCancelled = useCallback(() => {
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
  }, []);

  // Use polling hook. The BPMN assistant has a request timeout of its own, a third of the
  // universal one — the wait is matched to it, not to the default.
  const { startPolling, stopPolling, activeRequestId } = usePolling({
    fetchStatus,
    timeoutMs: BPMN_AI_REQUEST_WAIT_MS,
    onResult: handlePollingResult,
    onError: handlePollingError,
    onCancelled: handlePollingCancelled
  });

  // Handle submit
  const handleSubmit = useCallback(
    async e => {
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
          throw new Error(t('ai-assistant.chat.no-request-id'));
        }

        startPolling(requestId);

        const processingMessage = {
          id: generateUUID(),
          text: t('ai-assistant.message.processing'),
          sender: 'ai',
          timestamp: new Date(),
          isProcessing: true,
          pollingIsUsed: true
        };

        setMessages(prevMessages => [...prevMessages, processingMessage]);
      } catch (error) {
        console.error('Error in contextual chat:', error);

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
    [message, contextType, conversationId, startPolling]
  );

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
              text: t('ai-assistant.chat.cancelled'),
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
