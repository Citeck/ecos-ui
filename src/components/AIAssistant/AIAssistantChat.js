import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import aiAssistantService from "./AIAssistantService";
import aiAssistantContext, { CONTEXT_TYPES } from "./AIAssistantContext";
import { Icon } from "../common";
import Records from "../Records";
import { getRecordRef } from "@/helpers/urls";
import { IS_APPLE, useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import "./style.scss";
import { SourcesId } from "@/constants/index.js";

const POLLING_INTERVAL = 2000;
const DEFAULT_WIDTH = 350;
const DEFAULT_HEIGHT = 500;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 300;

const AUTOCOMPLETE_QUERY_THRESHOLD = 2;

const TAB_TYPES = {
  UNIVERSAL: "universal",
  CONTEXTUAL: "contextual"
};

const ADDITIONAL_CONTEXT_TYPES = {
  CURRENT_RECORD: "current_record"
};

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const AIAssistantChat = () => {
  const [activeTab, setActiveTab] = useState(TAB_TYPES.UNIVERSAL);
  const [isOpen, setIsOpen] = useState(aiAssistantService.isOpen);
  const [isMinimized, setIsMinimized] = useState(aiAssistantService.isMinimized);
  const [contextType, setContextType] = useState(() => {
    return aiAssistantContext.getContext();
  });
  const [chatSize, setChatSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  // Universal chat state
  const [universalMessage, setUniversalMessage] = useState("");
  const [universalMessages, setUniversalMessages] = useState([]);
  const [universalIsLoading, setUniversalIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => generateUUID());

  // Additional context state
  const [selectedAdditionalContext, setSelectedAdditionalContext] = useState([]);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [additionalContext, setAdditionalContext] = useState({
    records: []
  });

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [currentRecordForAutocomplete, setCurrentRecordForAutocomplete] = useState(null);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Contextual chat state (existing functionality)
  const [contextualMessage, setContextualMessage] = useState("");
  const [contextualMessages, setContextualMessages] = useState([]);
  const [contextualIsLoading, setContextualIsLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [pollingTimer, setPollingTimer] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const messagesEndRef = useRef(null);
  const universalTextareaRef = useRef(null);
  const contextualTextareaRef = useRef(null);
  const chatRef = useRef(null);
  const contextMenuRef = useRef(null);

  const useAIAssistantShortcut = (callback, deps = []) => {
    const modifiers = IS_APPLE
      ? { meta: true, alt: false, shift: false, ctrl: false }
      : { meta: false, alt: true, shift: false, ctrl: false };

    useKeyboardShortcut("i", modifiers, callback, deps);
  };

  useAIAssistantShortcut(() => {
    aiAssistantService.toggleChat();
  });

  // Sync state with service
  useEffect(() => {
    const handleStateChange = (newIsOpen, newIsMinimized) => {
      setIsOpen(newIsOpen);
      setIsMinimized(newIsMinimized);
    };

    aiAssistantService.addListener(handleStateChange);

    const savedSize = localStorage.getItem("aiAssistantChatSize");
    if (savedSize) {
      try {
        const parsedSize = JSON.parse(savedSize);
        setChatSize(parsedSize);
      } catch (e) {
        console.error("Failed to parse saved chat size:", e);
      }
    }

    return () => {
      aiAssistantService.removeListener(handleStateChange);
    };
  }, []);

  // Update context when it changes
  useEffect(() => {
    const checkContext = () => {
      const currentContext = aiAssistantContext.getContext();
      if (currentContext !== contextType) {
        setContextType(currentContext);
        setContextualMessages([]);

        // If no context available and user is on contextual tab, switch to universal
        if (!currentContext && activeTab === TAB_TYPES.CONTEXTUAL) {
          setActiveTab(TAB_TYPES.UNIVERSAL);
        }
      }
    };

    const intervalId = setInterval(checkContext, 500); // More frequent checking
    return () => clearInterval(intervalId);
  }, [contextType, activeTab]);

  // Set active tab based on context when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const currentContext = aiAssistantContext.getContext();

      if (currentContext) {
        setActiveTab(TAB_TYPES.CONTEXTUAL);
      } else {
        setActiveTab(TAB_TYPES.UNIVERSAL);
      }
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus on input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        if (activeTab === TAB_TYPES.UNIVERSAL && universalTextareaRef.current) {
          universalTextareaRef.current.focus();
        } else if (activeTab === TAB_TYPES.CONTEXTUAL && contextualTextareaRef.current) {
          contextualTextareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, isMinimized, activeTab]);

  // Also focus when switching tabs
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        if (activeTab === TAB_TYPES.UNIVERSAL && universalTextareaRef.current) {
          universalTextareaRef.current.focus();
        } else if (activeTab === TAB_TYPES.CONTEXTUAL && contextualTextareaRef.current) {
          contextualTextareaRef.current.focus();
        }
      }, 50);
    }
  }, [activeTab, isOpen, isMinimized]);

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [pollingTimer]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [universalMessages, contextualMessages]);

  useEffect(() => {
    if (universalTextareaRef.current) {
      universalTextareaRef.current.style.height = "auto";
      universalTextareaRef.current.style.height = `${universalTextareaRef.current.scrollHeight}px`;
    }
  }, [universalMessage]);

  useEffect(() => {
    if (contextualTextareaRef.current) {
      contextualTextareaRef.current.style.height = "auto";
      contextualTextareaRef.current.style.height = `${contextualTextareaRef.current.scrollHeight}px`;
    }
  }, [contextualMessage]);

  const clearUniversalConversation = async () => {
    try {
      const response = await fetch(`/gateway/ai/api/assistant/universal/conversation/${conversationId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setUniversalMessages([]);
        setConversationId(generateUUID()); // Generate new conversation ID

        // Clear additional context
        setAdditionalContext({ records: [] });
        setSelectedAdditionalContext([]);
      }
    } catch (error) {
      console.error("Error clearing conversation:", error);
    }
  };

  // Additional context functions
  const getAdditionalContext = async (contextType) => {
    try {
      switch (contextType) {
        case ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD:
          const recordRef = getRecordRef();
          if (recordRef) {
            const recordData = await Records.get(recordRef).load({
              displayName: "?disp",
              type: "_type?id"
            });

            return {
              recordRef,
              ...recordData
            };
          }
          return null;

        default:
          return null;
      }
    } catch (error) {
      console.error("Error getting additional context:", error);
      return null;
    }
  };

  const toggleAdditionalContext = async (contextType, specificRecord = null) => {
    if (contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) {

      let recordData = specificRecord;
      if (!recordData) {
        recordData = await getAdditionalContext(contextType);
      }

      if (!recordData) return;

      const existingRecordIndex = additionalContext.records.findIndex(
        record => record.recordRef === recordData.recordRef
      );

      if (existingRecordIndex !== -1) {
        // Remove from context
        setAdditionalContext(prev => ({
          ...prev,
          records: prev.records.filter((_, index) => index !== existingRecordIndex)
        }));

        // If there are no more records, remove the context type
        if (additionalContext.records.length === 1) {
          setSelectedAdditionalContext(prev => prev.filter(c => c !== contextType));
        }
      } else {
        // Add record to context
        setAdditionalContext(prev => ({
          ...prev,
          records: [...prev.records, recordData]
        }));

        // Add context type if not already selected
        if (!selectedAdditionalContext.includes(contextType)) {
          setSelectedAdditionalContext(prev => [...prev, contextType]);
        }
      }
    }
  };

  const handleClose = () => {
    if (activeRequestId) {
      cancelActiveRequest();
    }

    if (pollingTimer) {
      clearInterval(pollingTimer);
      setPollingTimer(null);
    }

    setActiveRequestId(null);
    setContextualIsLoading(false);
    setUniversalIsLoading(false);
    setIsPolling(false);
    aiAssistantService.closeChat();
  };

  const handleMinimize = () => {
    const newState = aiAssistantService.toggleMinimize();
    setIsMinimized(newState);

    // Focus on input when restoring from minimized state
    if (!newState && isOpen) {
      setTimeout(() => {
        if (activeTab === TAB_TYPES.UNIVERSAL && universalTextareaRef.current) {
          universalTextareaRef.current.focus();
        } else if (activeTab === TAB_TYPES.CONTEXTUAL && contextualTextareaRef.current) {
          contextualTextareaRef.current.focus();
        }
      }, 100);
    }
  };

  const handleUniversalSubmit = async (e) => {
    e.preventDefault();
    if (!universalMessage.trim()) return;

    const userMessage = { text: universalMessage, sender: "user", timestamp: new Date() };
    setUniversalMessages(prevMessages => [...prevMessages, userMessage]);

    setUniversalMessage("");
    setUniversalIsLoading(true);

    // Add processing message for data type generation
    const isDataTypeRequest = universalMessage.toLowerCase().includes("тип данных") ||
      universalMessage.toLowerCase().includes("data type");

    if (isDataTypeRequest) {
      const processingMessage = {
        text: "Анализирую запрос и готовлю ответ по типу данных...",
        sender: "ai",
        timestamp: new Date(),
        isProcessing: true
      };
      setUniversalMessages(prevMessages => [...prevMessages, processingMessage]);
    }

    try {
      const requestData = {
        message: universalMessage,
        conversationId: conversationId,
        context: additionalContext
      };

      const response = await fetch("/gateway/ai/api/assistant/universal/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Remove processing message and add actual response
      setUniversalMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => !msg.isProcessing);
        const aiMessage = {
          text: data.message || "Не удалось получить ответ.",
          sender: "ai",
          timestamp: new Date(),
          hasDataTypeContent: data.message && (
            data.message.includes("getDataTypeSchema") ||
            data.message.includes("validateDataType") ||
            data.message.includes("deployDataType") ||
            data.message.includes("\"id\":") ||
            data.message.includes("JSON схема")
          )
        };
        return [...filteredMessages, aiMessage];
      });

    } catch (error) {
      console.error("Error in universal chat:", error);

      setUniversalMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => !msg.isProcessing);
        const errorMessage = {
          text: "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.",
          sender: "ai",
          timestamp: new Date(),
          isError: true
        };
        return [...filteredMessages, errorMessage];
      });

    } finally {
      setUniversalIsLoading(false);
    }
  };

  const cancelActiveRequest = async () => {
    if (!activeRequestId) return;

    try {
      const response = await fetch(`/gateway/ai/api/assistant/bpmn/${activeRequestId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        console.error(`Error cancelling request: ${response.status}`);
        return;
      }

      if (pollingTimer) {
        clearInterval(pollingTimer);
        setPollingTimer(null);
      }

      setContextualMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.isProcessing) {
            return {
              ...msg,
              text: "Запрос был отменен.",
              isProcessing: false,
              isCancelled: true
            };
          }
          return msg;
        })
      );

      setActiveRequestId(null);
      setContextualIsLoading(false);
      setIsPolling(false);

    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  const pollRequestStatus = async (requestId) => {
    if (isPolling) return;

    try {
      setIsPolling(true);

      const response = await fetch(`/gateway/ai/api/assistant/bpmn/${requestId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.result) {
        clearInterval(pollingTimer);
        setPollingTimer(null);
        setActiveRequestId(null);
        setContextualIsLoading(false);

        if (data.result && contextType === CONTEXT_TYPES.BPMN_EDITOR) {
          aiAssistantService.handleSubmit(data.result);
        }

        setContextualMessages(prevMessages =>
          prevMessages.map((msg, index) => {
            if (msg.isProcessing) {
              return {
                text: "Процесс успешно создан и загружен в редактор.",
                sender: "ai",
                timestamp: new Date()
              };
            }
            return msg;
          })
        );

      } else if (data.error) {
        clearInterval(pollingTimer);
        setPollingTimer(null);
        setActiveRequestId(null);
        setContextualIsLoading(false);

        setContextualMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.isProcessing) {
              return {
                ...msg,
                text: `Ошибка: ${data.error || "Произошла неизвестная ошибка"}`,
                isProcessing: false,
                isError: true
              };
            }
            return msg;
          })
        );

      } else if (data.status === "cancelled") {
        clearInterval(pollingTimer);
        setPollingTimer(null);
        setActiveRequestId(null);
        setContextualIsLoading(false);

        setContextualMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.isProcessing) {
              return {
                ...msg,
                text: "Запрос был отменен.",
                isProcessing: false,
                isCancelled: true
              };
            }
            return msg;
          })
        );
      }

    } catch (error) {
      console.error("Error polling request status:", error);

      clearInterval(pollingTimer);
      setPollingTimer(null);
      setActiveRequestId(null);
      setContextualIsLoading(false);

      setContextualMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.isProcessing) {
            return {
              ...msg,
              text: "Произошла ошибка при получении результата. Пожалуйста, попробуйте снова.",
              isProcessing: false,
              isError: true
            };
          }
          return msg;
        })
      );
    } finally {
      setIsPolling(false);
    }
  };

  const handleContextualSubmit = async (e) => {
    e.preventDefault();
    if (!contextualMessage.trim()) return;

    const userMessage = { text: contextualMessage, sender: "user", timestamp: new Date() };
    setContextualMessages(prevMessages => [...prevMessages, userMessage]);

    setContextualMessage("");
    setContextualIsLoading(true);

    try {
      // Existing contextual logic
      if (contextType === CONTEXT_TYPES.BPMN_EDITOR) {
        const contextHandler = aiAssistantContext.getHandler("updateContextBeforeRequest");
        if (typeof contextHandler === "function") {
          await new Promise(resolve => contextHandler(resolve));
        }

        const contextData = aiAssistantContext.getContextData();
        const { processRef, ecosType, currentBpmnXml } = contextData;

        const requestData = {
          userInput: contextualMessage,
          processRef: processRef || "",
          ecosType: ecosType || "",
          currentBpmnXml: currentBpmnXml || ""
        };

        const response = await fetch("/gateway/ai/api/assistant/bpmn", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        const requestId = data.requestId;

        if (!requestId) {
          throw new Error("Не удалось получить ID запроса");
        }

        setActiveRequestId(requestId);

        const timer = setInterval(() => pollRequestStatus(requestId), POLLING_INTERVAL);
        setPollingTimer(timer);

        const processingMessage = {
          text: "Запрос обрабатывается. Это может занять некоторое время...",
          sender: "ai",
          timestamp: new Date(),
          isProcessing: true,
          pollingIsUsed: true
        };

        setContextualMessages(prevMessages => [...prevMessages, processingMessage]);

      } else {
        setTimeout(() => {
          const aiMessage = {
            text: "Извините, этот контекст пока не поддерживается.",
            sender: "ai",
            timestamp: new Date()
          };

          setContextualMessages(prevMessages => [...prevMessages, aiMessage]);
          setContextualIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);

      const errorMessage = {
        text: "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.",
        sender: "ai",
        timestamp: new Date(),
        isError: true
      };

      setContextualMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.isProcessing) {
            return errorMessage;
          }
          return msg;
        }).concat(
          !prevMessages.some(msg => msg.isProcessing) ? [errorMessage] : []
        )
      );

      setContextualIsLoading(false);

      if (pollingTimer) {
        clearInterval(pollingTimer);
        setPollingTimer(null);
      }

      setActiveRequestId(null);
    }
  };

  const handleKeyDown = (e, isUniversal) => {
    // Handle autocomplete navigation
    if (showAutocomplete && isUniversal) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => {
          const filteredOptions = getFilteredAutocompleteOptions();
          const newIndex = prev < filteredOptions.length - 1 ? prev + 1 : 0;

          // Scroll selected item into view
          setTimeout(() => {
            const autocompleteContainer = document.querySelector(".ai-assistant-chat__autocomplete");
            const selectedItem = document.querySelector(".ai-assistant-chat__autocomplete-item--selected");
            if (autocompleteContainer && selectedItem) {
              selectedItem.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
              });
            }
          }, 0);

          return newIndex;
        });
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => {
          const filteredOptions = getFilteredAutocompleteOptions();
          const newIndex = prev > 0 ? prev - 1 : filteredOptions.length - 1;

          // Scroll selected item into view
          setTimeout(() => {
            const autocompleteContainer = document.querySelector(".ai-assistant-chat__autocomplete");
            const selectedItem = document.querySelector(".ai-assistant-chat__autocomplete-item--selected");
            if (autocompleteContainer && selectedItem) {
              selectedItem.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
              });
            }
          }, 0);

          return newIndex;
        });
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const filteredOptions = getFilteredAutocompleteOptions();
        const selectedOption = filteredOptions[selectedAutocompleteIndex];
        if (selectedOption && !selectedOption.disabled) {
          insertContextMention(selectedOption.type, selectedOption.recordData);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setShowAutocomplete(false);
        setSelectedAutocompleteIndex(0);
        return;
      }
    }

    // Regular message submission
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isUniversal) {
        handleUniversalSubmit(e);
      } else {
        handleContextualSubmit(e);
      }
    }
  };

  // Helper function to get filtered autocomplete options
  const getFilteredAutocompleteOptions = () => {
    const isCurrentRecordInContext = currentRecordForAutocomplete && additionalContext.records.some(
      record => record.recordRef === currentRecordForAutocomplete.recordRef
    );

    const recordDescription = currentRecordForAutocomplete
      ? `Добавить "${currentRecordForAutocomplete.displayName || currentRecordForAutocomplete.recordRef}"${isCurrentRecordInContext ? " (уже добавлена)" : ""}`
      : "Добавить данные текущей записи";

    const contextOptions = [
      {
        type: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
        label: "запись",
        icon: "fa-database",
        description: recordDescription,
        disabled: isCurrentRecordInContext,
        isCurrentRecord: true
      }
    ];

    // Add search results if query is long enough
    if (autocompleteQuery.length >= AUTOCOMPLETE_QUERY_THRESHOLD && searchResults.length > 0) {
      const searchOptions = searchResults.map(record => {
        const isInContext = additionalContext.records.some(
          contextRecord => contextRecord.recordRef === record.recordRef
        );

        return {
          type: "search_result",
          label: record.displayName,
          icon: "fa-file-o",
          description: `Добавить "${record.displayName}"${isInContext ? " (уже добавлена)" : ""}`,
          disabled: isInContext,
          recordData: record
        };
      });

      contextOptions.push(...searchOptions);
    }

    return contextOptions.filter(option =>
      option.isCurrentRecord ||
      autocompleteQuery.length >= AUTOCOMPLETE_QUERY_THRESHOLD ||
      option.label.toLowerCase().includes(autocompleteQuery.toLowerCase())
    );
  };

  const getContextTitle = () => {
    const context = aiAssistantContext.getContext(); // Use real-time context
    switch (context) {
      case CONTEXT_TYPES.BPMN_EDITOR:
        return "BPMN Редактор";
      default:
        return "Нет контекста";
    }
  };

  const getContextHint = () => {
    const context = aiAssistantContext.getContext(); // Use real-time context
    switch (context) {
      case CONTEXT_TYPES.BPMN_EDITOR:
        return "Например: \"Создай процесс обработки заявки на отпуск, который включает этапы согласования с руководителем и отделом кадров\". Чем детальнее описание, тем точнее будет результат.";
      default:
        return "Контекст не определен";
    }
  };

  const handleResize = (event, { size }) => {
    const { width, height } = size;
    setChatSize({ width, height });
    localStorage.setItem("aiAssistantChatSize", JSON.stringify({ width, height }));
  };

  const renderMessages = (messages, isLoading) => {
    if (messages.length === 0) {
      return (
        <div className="ai-assistant-chat__empty">
          <div className="ai-assistant-chat__welcome">
            <h4>👋 Привет! Я - Citeck AI Assistant</h4>
            <p>Я помогу вам автоматизировать бизнес-процессы и работать с документами.</p>
          </div>

          {activeTab === TAB_TYPES.UNIVERSAL && (
            <div className="ai-assistant-chat__capabilities">
              <div className="ai-assistant-chat__capability">
                <strong>📋 Типы данных:</strong> создание, редактирование и анализ
              </div>
              <div className="ai-assistant-chat__capability">
                <strong>🔄 BPMN:</strong> генерация бизнес-процессов
              </div>
              <div className="ai-assistant-chat__capability">
                <strong>📄 Документы:</strong> анализ, сравнение версий, Q&A
              </div>

              <p className="ai-assistant-chat__hint">
                <strong>Примеры запросов:</strong><br />
                • "Создай тип данных для заявки на отпуск"<br />
                • "Проанализируй документ @запись"<br />
                • "Что ты умеешь делать?"
              </p>

              <p className="ai-assistant-chat__tip">
                💡 Используйте <code>@</code> для добавления контекста
              </p>
            </div>
          )}

          {activeTab === TAB_TYPES.CONTEXTUAL && (
            <p className="ai-assistant-chat__hint">{getContextHint()}</p>
          )}
        </div>
      );
    }

    return messages.map((msg, index) => (
      <div
        key={index}
        className={classNames(
          "ai-assistant-chat__message",
          `ai-assistant-chat__message--${msg.sender}`,
          {
            "ai-assistant-chat__message--error": msg.isError,
            "ai-assistant-chat__message--processing": msg.isProcessing,
            "ai-assistant-chat__message--cancelled": msg.isCancelled,
            "ai-assistant-chat__message--datatype": msg.hasDataTypeContent
          }
        )}
      >
        <div className="ai-assistant-chat__message-content">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              )
            }}
          >
            {msg.text}
          </Markdown>
        </div>
        {msg.isProcessing && msg.pollingIsUsed && (
          <div className="ai-assistant-chat__cancel-action">
            <button
              className="ai-assistant-chat__action-button ai-assistant-chat__action-button--cancel"
              onClick={cancelActiveRequest}
            >
              Отменить
            </button>
          </div>
        )}
        <div className="ai-assistant-chat__message-time">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
        </div>
      </div>
    ));
  };

  const renderContextTags = () => {
    if (selectedAdditionalContext.length === 0) return null;

    return (
      <div className="ai-assistant-chat__context-tags">
        {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) &&
          additionalContext.records.map((record, index) => (
            <div key={`${ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD}-${index}`} className="ai-assistant-chat__context-tag">
              <span>{record.displayName || record.recordRef || "Запись"}</span>
              <button
                className="ai-assistant-chat__context-tag-remove"
                onClick={() => toggleAdditionalContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, record)}
                title="Удалить из контекста"
              >
                <Icon className="fa fa-times" />
              </button>
            </div>
          ))
        }
      </div>
    );
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setIsContextMenuOpen(false);
      }
    };

    const handleClickOutsideAutocomplete = (event) => {
      if (showAutocomplete && !event.target.closest(".ai-assistant-chat__autocomplete")) {
        setShowAutocomplete(false);
      }
    };

    if (isContextMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    if (showAutocomplete) {
      document.addEventListener("mousedown", handleClickOutsideAutocomplete);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutsideAutocomplete);
    };
  }, [isContextMenuOpen, showAutocomplete]);

  // Handle @ autocomplete
  const handleInputChange = (e, isUniversal) => {
    const value = e.target.value;
    const currentSetMessage = isUniversal ? setUniversalMessage : setContextualMessage;
    currentSetMessage(value);

    if (isUniversal) {
      // Check for @ symbol
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const queryAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (queryAfterAt.length >= 0 && !queryAfterAt.includes(" ")) {
          setAutocompleteQuery(queryAfterAt);
          setSelectedAutocompleteIndex(0); // Reset selection when query changes
          setShowAutocomplete(true);

          // Load current record data for autocomplete
          getAdditionalContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD)
            .then(data => {
              setCurrentRecordForAutocomplete(data);

              if (queryAfterAt.length >= AUTOCOMPLETE_QUERY_THRESHOLD && data && data.type) {
                searchRecordsByDisp(queryAfterAt, data.type)
                  .then(results => {
                    setSearchResults(results);
                  });
              } else {
                setSearchResults([]);
              }
            });

          // Calculate position for autocomplete dropdown
          const textarea = e.target;
          const rect = textarea.getBoundingClientRect();

          // Calculate cursor position in textarea
          const textBeforeCursor = value.substring(0, cursorPosition);
          const lines = textBeforeCursor.split("\n");
          const currentLineIndex = lines.length - 1;
          const currentLineText = lines[currentLineIndex];

          // Estimate position based on line height and character position
          const lineHeight = 20; // Approximate line height
          const charWidth = 8; // Approximate character width
          const padding = 12; // Textarea padding

          const top = rect.top + padding + (currentLineIndex * lineHeight) + lineHeight + 5;
          const left = rect.left + padding + (currentLineText.length * charWidth);

          setAutocompletePosition({
            top: Math.min(top, window.innerHeight - 200), // Prevent going off screen
            left: Math.min(left, window.innerWidth - 300)
          });
        } else {
          setShowAutocomplete(false);
          setSelectedAutocompleteIndex(0);
          setSearchResults([]);
        }
      } else {
        setShowAutocomplete(false);
        setSelectedAutocompleteIndex(0);
        setSearchResults([]);
      }
    }
  };

  const insertContextMention = async (contextType, recordData = null) => {
    let contextLabel = "запись"; // fallback
    let contextDataToAdd = null;

    if (contextType === "search_result" && recordData) {
      // Handle search result
      contextLabel = recordData.displayName || recordData.recordRef;
      contextDataToAdd = recordData;
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) {
      // Handle current record
      const contextData = await getAdditionalContext(contextType);
      if (contextData) {
        contextLabel = contextData.displayName || contextData.recordRef || "запись";
        contextDataToAdd = contextData;
      }
    }

    const currentMessage = universalMessage;
    const cursorPosition = universalTextareaRef.current.selectionStart;
    const textBeforeCursor = currentMessage.substring(0, cursorPosition);
    const textAfterCursor = currentMessage.substring(cursorPosition);

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const newText = textBeforeCursor.substring(0, lastAtIndex) +
      `@${contextLabel} ` +
      textAfterCursor;

    setUniversalMessage(newText);
    setShowAutocomplete(false);
    setSelectedAutocompleteIndex(0);
    setSearchResults([]);

    // Focus textarea and set cursor position
    setTimeout(() => {
      if (universalTextareaRef.current) {
        const newCursorPosition = lastAtIndex + contextLabel.length + 2; // +2 for "@" and " "
        universalTextareaRef.current.focus();
        universalTextareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);

    // Auto-add context data
    if (contextDataToAdd) {
      if (contextType === "search_result") {
        // Add specific record to context
        setAdditionalContext(prev => ({
          ...prev,
          records: [...prev.records, contextDataToAdd]
        }));

        if (!selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD)) {
          setSelectedAdditionalContext(prev => [...prev, ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD]);
        }
      } else {
        toggleAdditionalContext(contextType);
      }
    }
  };

  const renderAutocomplete = () => {
    if (!showAutocomplete) return null;

    const filteredOptions = getFilteredAutocompleteOptions();

    if (filteredOptions.length === 0 && !isSearching) return null;

    return (
      <div
        className="ai-assistant-chat__autocomplete"
        style={{
          position: "fixed",
          top: autocompletePosition.top,
          left: autocompletePosition.left,
          zIndex: 105001
        }}
      >
        {isSearching && autocompleteQuery.length >= 3 && (
          <div className="ai-assistant-chat__autocomplete-item ai-assistant-chat__autocomplete-item--loading">
            <Icon className="fa fa-spinner fa-spin ai-assistant-chat__autocomplete-icon" />
            <div className="ai-assistant-chat__autocomplete-text">
              <div className="ai-assistant-chat__autocomplete-label">Поиск записей...</div>
            </div>
          </div>
        )}
        {filteredOptions.map((option, index) => (
          <div
            key={`${option.type}-${option.recordData?.recordRef || "current"}`}
            className={classNames(
              "ai-assistant-chat__autocomplete-item",
              {
                "ai-assistant-chat__autocomplete-item--disabled": option.disabled,
                "ai-assistant-chat__autocomplete-item--selected": index === selectedAutocompleteIndex
              }
            )}
            onClick={() => !option.disabled && insertContextMention(option.type, option.recordData)}
          >
            <Icon className={`fa ${option.icon} ai-assistant-chat__autocomplete-icon`} />
            <div className="ai-assistant-chat__autocomplete-text">
              <div className="ai-assistant-chat__autocomplete-label">@{option.label}</div>
              <div className="ai-assistant-chat__autocomplete-description">{option.description}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Auto-detect and track current record changes for potential context addition
  useEffect(() => {
    const checkCurrentRecord = async () => {
      if (isOpen && !isMinimized) {
        // We just track URL changes, but don't add them automatically.
        // The user decides which entries to add to the context
      }
    };

    checkCurrentRecord();
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!isOpen || isMinimized) {
      setShowAutocomplete(false);
      setSelectedAutocompleteIndex(0);
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [isOpen, isMinimized]);

  // Search records by _disp attribute
  const searchRecordsByDisp = async (query, recordType) => {
    if (!query || query.length < AUTOCOMPLETE_QUERY_THRESHOLD) {
      return [];
    }

    try {
      setIsSearching(true);

      let recordTypeId = "";
      const atIndex = recordType.indexOf("@");
      if (atIndex !== -1) {
        recordTypeId = recordType.substring(atIndex + 1);
      }

      const rType = SourcesId.RESOLVED_TYPE + "@" + recordTypeId;

      let sourceId;
      try {
        sourceId = await Records.get(rType).load("sourceId");
      } catch (e) {
        console.log("Error loading sourceId for type:", rType, e);
      }

      const searchQuery = {
        sourceId: sourceId,
        language: "predicate",
        query: {
          t: "and",
          v: [
            {
              t: "eq",
              a: "_type",
              v: recordType
            },
            {
              t: "contains",
              a: "_disp",
              v: query
            }
          ]
        },
        page: {
          maxItems: 5
        }
      };

      const result = await Records.query(searchQuery, {
        recordRef: "?id",
        displayName: "_disp",
        type: "_type?id"
      });

      return result.records || [];
    } catch (error) {
      console.error("Error searching records:", error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const currentRealTimeContext = aiAssistantContext.getContext();
  const hasContext = !!currentRealTimeContext;
  const currentMessages = activeTab === TAB_TYPES.UNIVERSAL ? universalMessages : contextualMessages;
  const currentMessage = activeTab === TAB_TYPES.UNIVERSAL ? universalMessage : contextualMessage;
  const currentIsLoading = activeTab === TAB_TYPES.UNIVERSAL ? universalIsLoading : contextualIsLoading;
  const currentHandleSubmit = activeTab === TAB_TYPES.UNIVERSAL ? handleUniversalSubmit : handleContextualSubmit;

  return (
    <div className="ai-assistant-resizable">
      {renderAutocomplete()}
      <ResizableBox
        width={chatSize.width}
        height={isMinimized ? 50 : chatSize.height}
        minConstraints={[MIN_WIDTH, MIN_HEIGHT]}
        onResize={handleResize}
        resizeHandles={["nw"]}
        disableResize={isMinimized}
      >
        <div className={classNames("ai-assistant-chat ai-assistant-chat--tabs", { "minimized": isMinimized })}
             ref={chatRef}>
          <div className="ai-assistant-chat__header">
            <h3 className="ai-assistant-chat__title">Citeck AI</h3>
            <div className="ai-assistant-chat__header-actions">
              <button
                className="ai-assistant-chat__minimize"
                onClick={handleMinimize}
                title={isMinimized ? "Развернуть" : "Свернуть"}
              >
                <Icon
                  className={classNames(
                    "ai-assistant-chat__icon",
                    "fa",
                    isMinimized ? "fa-window-restore" : "fa-window-minimize"
                  )}
                />
              </button>
              <button
                className="ai-assistant-chat__close"
                onClick={handleClose}
                title="Закрыть"
              >
                <Icon
                  className="ai-assistant-chat__icon fa fa-times"
                />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="ai-assistant-chat__tabs">
                <button
                  className={classNames(
                    "ai-assistant-chat__tab",
                    { "ai-assistant-chat__tab--active": activeTab === TAB_TYPES.UNIVERSAL }
                  )}
                  onClick={() => setActiveTab(TAB_TYPES.UNIVERSAL)}
                >
                  <span>Универсальный помощник</span>
                </button>
                {hasContext && (
                  <button
                    className={classNames(
                      "ai-assistant-chat__tab",
                      { "ai-assistant-chat__tab--active": activeTab === TAB_TYPES.CONTEXTUAL }
                    )}
                    onClick={() => setActiveTab(TAB_TYPES.CONTEXTUAL)}
                    title={`Контекстный помощник - ${getContextTitle()}`}
                  >
                    <span>{getContextTitle()}</span>
                  </button>
                )}
              </div>

              <div className="ai-assistant-chat__messages">
                {renderMessages(currentMessages, currentIsLoading)}

                {currentIsLoading && !activeRequestId && (
                  <div
                    className="ai-assistant-chat__message ai-assistant-chat__message--ai ai-assistant-chat__message--loading">
                    <div className="ai-assistant-chat__loading-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="ai-assistant-chat__input-section">
                <form className="ai-assistant-chat__input-container" onSubmit={currentHandleSubmit}>
                  {activeTab === TAB_TYPES.UNIVERSAL && renderContextTags()}
                  <div className="ai-assistant-chat__input-wrapper">
                    <textarea
                      ref={activeTab === TAB_TYPES.UNIVERSAL ? universalTextareaRef : contextualTextareaRef}
                      className="ai-assistant-chat__input"
                      value={currentMessage}
                      onChange={(e) => handleInputChange(e, activeTab === TAB_TYPES.UNIVERSAL)}
                      onKeyDown={(e) => handleKeyDown(e, activeTab === TAB_TYPES.UNIVERSAL)}
                      disabled={currentIsLoading}
                      rows={1}
                      placeholder={activeTab === TAB_TYPES.UNIVERSAL ?
                        "Опишите, что вы хотите создать..." :
                        "Введите ваш запрос..."}
                    />
                    {activeTab === TAB_TYPES.UNIVERSAL && (
                      <button
                        type="button"
                        className="ai-assistant-chat__input-action"
                        onClick={clearUniversalConversation}
                        title="Очистить контекст"
                      >
                        <Icon className="fa fa-trash-o" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </ResizableBox>
    </div>
  );
};

export default AIAssistantChat;
