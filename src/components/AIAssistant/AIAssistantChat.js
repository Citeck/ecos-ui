import React, { useState, useEffect, useRef, useMemo } from "react";
import classNames from "classnames";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import aiAssistantService from "./AIAssistantService";
import editorContextService, { CONTEXT_TYPES } from "./EditorContextService";
import additionalContextService from "./AdditionalContextService";
import { AI_ASSISTANT_EVENTS, ADDITIONAL_CONTEXT_TYPES, AI_INTENTS } from "./constants";
import { Icon } from "../common";
import Records from "../Records";
import { getRecordRef, getWorkspaceId } from "@/helpers/urls";
import { IS_APPLE, useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { NotificationManager } from "@/services/notifications";
import DiffViewer from "./DiffViewer";
import MermaidDiagram from "./MermaidDiagram";
import "./style.scss";
import { SourcesId } from "@/constants/index.js";
import { EVENTS } from "@/components/widgets/BaseWidget";
import ecosXhr from '@/helpers/ecosXhr';

const POLLING_INTERVAL = 1000;
const DEFAULT_WIDTH = 350;
const DEFAULT_HEIGHT = 500;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 300;

const AUTOCOMPLETE_QUERY_THRESHOLD = 2;

const TAB_TYPES = {
  UNIVERSAL: "universal",
  CONTEXTUAL: "contextual"
};

const EDITOR_CONTEXT_HANDLERS = {
  GET_CURRENT_TEXT: "getCurrentText",
  UPDATE_CONTEXT_BEFORE_REQUEST: "updateContextBeforeRequest",
  UPDATE_LEXICAL_CONTENT: "updateLexicalContent"
};

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getStageStatus = (stageName, currentProgress, progressRange) => {
  if (!progressRange) return 'pending';

  const { min, max } = progressRange;

  if (currentProgress < min) return 'pending';
  if (currentProgress > max) return 'completed';
  return 'active';
};

const AIAssistantChat = () => {
  const [activeTab, setActiveTab] = useState(TAB_TYPES.UNIVERSAL);

  // Custom components for Markdown rendering - memoized to prevent unnecessary re-renders
  const markdownComponents = useMemo(() => ({
    a: ({ node, ...props }) => (
      <a {...props} target="_blank" rel="noopener noreferrer" />
    ),
    code: ({ node, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (language === 'mermaid') {
        return (
          <MermaidDiagram
            chart={String(children).replace(/\n$/, '')}
            className="ai-assistant-chat__mermaid-diagram"
          />
        );
      }

      // For non-mermaid code blocks, render as regular code
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  }), []);
  const [isOpen, setIsOpen] = useState(aiAssistantService.isOpen);
  const [isMinimized, setIsMinimized] = useState(aiAssistantService.isMinimized);
  const [contextType, setContextType] = useState(() => {
    return editorContextService.getContext();
  });
  const [chatSize, setChatSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  // Universal chat state
  const [universalMessage, setUniversalMessage] = useState("");
  const [universalMessages, setUniversalMessages] = useState([]);
  const [universalIsLoading, setUniversalIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => generateUUID());
  const [universalActiveRequestId, setUniversalActiveRequestId] = useState(null);
  const [universalPollingTimer, setUniversalPollingTimer] = useState(null);
  const [conversationForceIntent, setConversationForceIntent] = useState(null);

  // Additional context state
  const [selectedAdditionalContext, setSelectedAdditionalContext] = useState([]);
  const [selectedTextContext, setSelectedTextContext] = useState(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [additionalContext, setAdditionalContext] = useState({
    records: [],
    documents: [],
    attributes: []
  });

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [currentRecordForAutocomplete, setCurrentRecordForAutocomplete] = useState(null);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState([]);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    to: "",
    subject: "",
    body: "",
    addToActivities: true
  });

  // Text diff state
  const [isApplyingTextChanges, setIsApplyingTextChanges] = useState(false);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]); // Files currently being uploaded
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Business app generation progress state
  const [activeBusinessAppProgress, setActiveBusinessAppProgress] = useState(null);
  const [generationStages, setGenerationStages] = useState(null); // Динамические этапы с backend

  // Contextual chat state (existing functionality)
  const [contextualMessage, setContextualMessage] = useState("");
  const [contextualMessages, setContextualMessages] = useState([]);
  const [contextualIsLoading, setContextualIsLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [pollingTimer, setPollingTimer] = useState(null);

  const messagesEndRef = useRef(null);
  const universalTextareaRef = useRef(null);
  const contextualTextareaRef = useRef(null);
  const chatRef = useRef(null);
  const contextMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevUniversalMessagesLengthRef = useRef(0);
  const prevContextualMessagesLengthRef = useRef(0);
  const prevUniversalProcessingStateRef = useRef(false);
  const prevContextualProcessingStateRef = useRef(false);

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
      const currentContext = editorContextService.getContext();
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
      const currentContext = editorContextService.getContext();

      if (!currentContext || (currentContext == CONTEXT_TYPES.UNIVERSAL)) {
        setActiveTab(TAB_TYPES.UNIVERSAL);
      } else {
        setActiveTab(TAB_TYPES.CONTEXTUAL);
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
        clearTimeout(pollingTimer);
      }
      if (universalPollingTimer) {
        clearTimeout(universalPollingTimer);
      }
    };
  }, [pollingTimer, universalPollingTimer]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const currentUniversalLength = universalMessages.length;
    const currentContextualLength = contextualMessages.length;
    const currentUniversalProcessing = universalMessages.some(msg => msg.isProcessing);
    const currentContextualProcessing = contextualMessages.some(msg => msg.isProcessing);

    // Scroll only when:
    // 1. Number of messages changed (new message added or removed)
    // 2. Processing state changed from true to false (final response received)
    const shouldScrollUniversal =
      currentUniversalLength !== prevUniversalMessagesLengthRef.current ||
      (prevUniversalProcessingStateRef.current && !currentUniversalProcessing);

    const shouldScrollContextual =
      currentContextualLength !== prevContextualMessagesLengthRef.current ||
      (prevContextualProcessingStateRef.current && !currentContextualProcessing);

    if (shouldScrollUniversal || shouldScrollContextual) {
      scrollToBottom();
    }

    // Update refs
    prevUniversalMessagesLengthRef.current = currentUniversalLength;
    prevContextualMessagesLengthRef.current = currentContextualLength;
    prevUniversalProcessingStateRef.current = currentUniversalProcessing;
    prevContextualProcessingStateRef.current = currentContextualProcessing;
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

  // Handle adding context from external components (like Lexical editor)
  useEffect(() => {
    const handleAddContext = async (event) => {
      const { contextType, attribute } = event.detail;
      const recordRef = event.detail.recordRef ? event.detail.recordRef.split("-alias-")[0] : null;

      // Switch to universal tab
      setActiveTab(TAB_TYPES.UNIVERSAL);

      if (contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD && recordRef) {
        await additionalContextService.handleAddRecordContext(
          recordRef,
          additionalContext,
          setAdditionalContext,
          selectedAdditionalContext,
          setSelectedAdditionalContext,
          setUniversalMessage
        );

      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES && attribute) {
        additionalContextService.handleAddAttributeContext(
          recordRef,
          attribute,
          additionalContext,
          setAdditionalContext,
          selectedAdditionalContext,
          setSelectedAdditionalContext,
          setUniversalMessage
        );
      }

      // Focus on textarea
      setTimeout(() => {
        if (universalTextareaRef.current) {
          universalTextareaRef.current.focus();
          universalTextareaRef.current.setSelectionRange(
            universalTextareaRef.current.value.length,
            universalTextareaRef.current.value.length
          );
        }
      }, 50);
    };

    window.addEventListener(AI_ASSISTANT_EVENTS.ADD_CONTEXT, handleAddContext);

    return () => {
      window.removeEventListener(AI_ASSISTANT_EVENTS.ADD_CONTEXT, handleAddContext);
    };
  }, [isOpen, additionalContext, selectedAdditionalContext]);

  useEffect(() => {
    const handleAddTextReference = (event) => {
      const { reference, selectedText } = event.detail;

      setUniversalMessage(prev => {
        const newRef = `@${reference}`;

        // Check if this reference already exists in the message
        if (prev.includes(newRef)) {
          return prev;
        }

        // If there's already a selected text reference, replace it
        if (selectedTextContext && selectedTextContext.reference) {
          const existingRef = `@${selectedTextContext.reference}`;
          if (prev.includes(existingRef)) {
            return prev.replace(existingRef, newRef);
          }
        }

        // Otherwise, add new reference
        const newText = prev.trim() + (prev.trim() ? " " : "") + `${newRef} `;
        return newText;
      });

      setSelectedTextContext({
        text: selectedText,
        reference: reference
      });

      // Focus on textarea
      setTimeout(() => {
        if (universalTextareaRef.current) {
          universalTextareaRef.current.focus();
          universalTextareaRef.current.setSelectionRange(
            universalTextareaRef.current.value.length,
            universalTextareaRef.current.value.length
          );
        }
      }, 50);
    };

    window.addEventListener(AI_ASSISTANT_EVENTS.ADD_TEXT_REFERENCE, handleAddTextReference);

    return () => {
      window.removeEventListener(AI_ASSISTANT_EVENTS.ADD_TEXT_REFERENCE, handleAddTextReference);
    };
  }, []);

  const clearUniversalConversation = async () => {
    try {
      const response = await fetch(`/gateway/ai/api/assistant/universal/conversation/${conversationId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setUniversalMessages([]);
        setConversationId(generateUUID()); // Generate new conversation ID

        // Clear additional context
        setAdditionalContext({ records: [], documents: [], attributes: [] });
        setSelectedAdditionalContext([]);
        setSelectedTextContext(null);

        // Clear uploaded files
        setUploadedFiles([]);
        setUploadingFiles([]);

        // Clear conversation force intent
        setConversationForceIntent(null);

        // Clear business app progress and stages
        setActiveBusinessAppProgress(null);
        setGenerationStages(null);

        // Clear file input to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        editorContextService.clearContext();
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
          return await additionalContextService.loadCurrentRecordData();

        case ADDITIONAL_CONTEXT_TYPES.DOCUMENTS:
          return await additionalContextService.loadDocumentsData();

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

      additionalContextService.toggleRecordContext(
        recordData,
        additionalContext,
        setAdditionalContext,
        selectedAdditionalContext,
        setSelectedAdditionalContext
      );
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) {
      let documentData = specificRecord;
      if (!documentData && !specificRecord) {
        // This case shouldn't happen for documents as they need to be specific
        return;
      }

      if (!documentData) return;

      additionalContextService.toggleDocumentContext(
        documentData,
        additionalContext,
        setAdditionalContext,
        selectedAdditionalContext,
        setSelectedAdditionalContext
      );
    }
  };

  const removeSelectedTextContext = () => {
    setSelectedTextContext(null);
    // Also remove the reference from the message
    setUniversalMessage(prev => {
      if (selectedTextContext && selectedTextContext.reference) {
        return prev.replace(`@${selectedTextContext.reference} `, '').trim();
      }
      return prev;
    });
  };

  const handleClose = () => {
    if (activeRequestId) {
      cancelActiveRequest();
    }

    if (universalActiveRequestId) {
      cancelUniversalActiveRequest();
    }

    if (pollingTimer) {
      clearTimeout(pollingTimer);
      setPollingTimer(null);
    }

    if (universalPollingTimer) {
      clearTimeout(universalPollingTimer);
      setUniversalPollingTimer(null);
    }

    setActiveRequestId(null);
    setUniversalActiveRequestId(null);
    setContextualIsLoading(false);
    setUniversalIsLoading(false);
    setSelectedTextContext(null);
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

    const messageToProcess = universalMessage;
    setUniversalMessage("");
    setUniversalIsLoading(true);

    try {
      // Prepare context with automatic parentRef inclusion
      const contextToSend = {
        records: additionalContext.records ? Object.values(additionalContext.records) : [],
        documents: additionalContext.documents ? Object.values(additionalContext.documents) : [],
        attributes: additionalContext.attributes ? Object.values(additionalContext.attributes) : [],
        selectedTexts: additionalContext.selectedTexts || []
      };

      // If documents are selected but no records explicitly added,
      // automatically include parent records from documents
      if (contextToSend.documents.length > 0 && contextToSend.records.length === 0) {
        const parentRefs = contextToSend.documents
          .map(doc => doc.parentRef)
          .filter(parentRef => parentRef); // Remove null/undefined values

        // Get unique parent references
        const uniqueParentRefs = [...new Set(parentRefs)];

        // Load parent record data for each unique parentRef
        for (const parentRef of uniqueParentRefs) {
          try {
            const parentRecordData = await Records.get(parentRef).load({
              displayName: "?disp",
              type: "_type?id"
            });

            contextToSend.records.push({
              recordRef: parentRef,
              displayName: parentRecordData.displayName,
              type: parentRecordData.type
            });
          } catch (error) {
            console.error("Error loading parent record:", parentRef, error);
          }
        }
      }

      const contextData = editorContextService.getContextData();
      // Use conversation force intent first, then editor context force intent as fallback
      const forceIntent = conversationForceIntent || contextData.forceIntent || null;

      const selectionData = { // exists data
        records: contextToSend.records || [],
        attributes: contextToSend.attributes || [],
        documents: contextToSend.documents || []
      };
      const contentData = { // real-time data
        documents: uploadedFiles
      };

      // Add currentText for text editing context
      if (forceIntent === AI_INTENTS.TEXT_EDITING) {
        const getCurrentTextHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.GET_CURRENT_TEXT);
        if (typeof getCurrentTextHandler === "function") {
          const currentText = getCurrentTextHandler();
          if (currentText) {
            contentData.currentText = currentText;
          }
        }

        // Add selected text to content data
        const contextData = editorContextService.getContextData();
        if (contextData.selectionContext) {
          contentData.selectedText = contextData.selectionContext.html;
        }
      }

      const requestData = {
        message: messageToProcess,
        conversationId: conversationId,
        context: {
          workspace: getWorkspaceId(),
          selection: selectionData,
          content: contentData,
          forceIntent: forceIntent
        }
      };

      const response = await fetch("/gateway/ai/api/assistant/universal/async", {
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

      // Set available stages if they come with the first response
      if (data.initialProgress?.availableStages) {
        setGenerationStages(data.initialProgress.availableStages);
      }

      // Start polling for request status
      setUniversalActiveRequestId(requestId);
      pollUniversalRequestStatus(requestId);

      // Show appropriate processing message
      let processingMessage;
      if (data.detectedIntent === 'BUSINESS_APP_GENERATION' && data.initialProgress) {
        processingMessage = {
          sender: "ai",
          timestamp: new Date(),
          isProcessing: true,
          pollingIsUsed: true,
          isBusinessAppContent: true,
          messageData: {
            type: "business_app_generation",
            stage: data.initialProgress.stage,
            progress: data.initialProgress.progress,
            message: data.initialProgress.message
          }
        };
      } else {
        processingMessage = {
          text: "Запрос обрабатывается. Это может занять некоторое время...",
          sender: "ai",
          timestamp: new Date(),
          isProcessing: true,
          pollingIsUsed: true
        };
      }

      setUniversalMessages(prevMessages => [...prevMessages, processingMessage]);

    } catch (error) {
      console.error("Error in universal chat:", error);

      const errorMessage = {
        text: "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.",
        sender: "ai",
        timestamp: new Date(),
        isError: true
      };

      setUniversalMessages(prevMessages => [...prevMessages, errorMessage]);
      setUniversalIsLoading(false);

      if (universalPollingTimer) {
        clearTimeout(universalPollingTimer);
        setUniversalPollingTimer(null);
      }

      setUniversalActiveRequestId(null);
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
        clearTimeout(pollingTimer);
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

    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  const cancelUniversalActiveRequest = async () => {
    if (!universalActiveRequestId) return;

    try {
      const response = await fetch(`/gateway/ai/api/assistant/universal/${universalActiveRequestId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        console.error(`Error cancelling universal request: ${response.status}`);
        return;
      }

      if (universalPollingTimer) {
        clearTimeout(universalPollingTimer);
        setUniversalPollingTimer(null);
      }

      setUniversalMessages(prevMessages =>
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

      setUniversalActiveRequestId(null);
      setUniversalIsLoading(false);

    } catch (error) {
      console.error("Error cancelling universal request:", error);
    }
  };

  const pollRequestStatus = async (requestId) => {
    try {
      const response = await fetch(`/gateway/ai/api/assistant/bpmn/${requestId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.result) {
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
      } else if (data.status === "processing") {
        // Continue polling
        const timerId = setTimeout(() => pollRequestStatus(requestId), POLLING_INTERVAL);
        setPollingTimer(timerId);
      }

    } catch (error) {
      console.error("Error polling request status:", error);

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
    }
  };

  const pollUniversalRequestStatus = async (requestId) => {
    try {
      const response = await fetch(`/gateway/ai/api/assistant/universal/${requestId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.result) {
        setUniversalPollingTimer(null);
        setUniversalActiveRequestId(null);
        setUniversalIsLoading(false);

        // Update conversation force intent if provided in response
        if (data.result.forceIntent) {
          setConversationForceIntent(data.result.forceIntent);
        }

        // Clear active business app progress after a delay when completed
        const isBusinessAppCompleted = typeof data.result.message === "object" &&
          data.result.message?.type === "business_app_generation" &&
          data.result.message?.stage === "COMPLETED";

        if (isBusinessAppCompleted) {
          setTimeout(() => {
            setActiveBusinessAppProgress(null);
            setGenerationStages(null); // Очищаем этапы вместе с прогрессом
          }, 5000); // Clear after 5 seconds to let user see final state
        }

        setUniversalMessages(prevMessages => {
          // Remove processing messages
          const filteredMessages = prevMessages.filter(msg => !msg.isProcessing);

          const responseData = data.result;
          // Determine message type
          const isEmailMessage = typeof responseData.message === "object" && responseData.message?.type === "email";
          const isTextDiffMessage = typeof responseData.message === "object" && responseData.message?.type === "text_editing";
          const isBusinessAppMessage = typeof responseData.message === "object" && responseData.message?.type === "business_app_generation";

          let messageText;
          let aiMessage;

          if (isEmailMessage) {
            messageText = responseData.message.body;
            aiMessage = {
              text: messageText,
              sender: "ai",
              timestamp: new Date(),
              isEmailContent: true,
              messageData: responseData.message
            };
          } else if (isTextDiffMessage) {
            messageText = responseData.message.description || "Предлагаемые изменения:";

            aiMessage = {
              text: messageText,
              sender: "ai",
              timestamp: new Date(),
              isTextDiffContent: true,
              messageData: responseData.message
            };
          } else if (isBusinessAppMessage) {
            messageText = responseData.message.message || "Обрабатывается запрос на создание бизнес-приложения...";

            if (responseData.message.availableStages && !generationStages) {
              setGenerationStages(responseData.message.availableStages);
            }

            aiMessage = {
              text: messageText,
              sender: "ai",
              timestamp: new Date(),
              isBusinessAppContent: true,
              messageData: responseData.message
            };
          } else {
            messageText = responseData.message || "Не удалось получить ответ.";
            aiMessage = {
              text: messageText,
              sender: "ai",
              timestamp: new Date()
            };
          }

          return [...filteredMessages, aiMessage];
        });

      } else if (data.error) {
        setUniversalPollingTimer(null);
        setUniversalActiveRequestId(null);
        setUniversalIsLoading(false);

        setUniversalMessages(prevMessages =>
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
        setUniversalPollingTimer(null);
        setUniversalActiveRequestId(null);
        setUniversalIsLoading(false);

        setUniversalMessages(prevMessages =>
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
      } else if (data.status === "processing") {
        // Update progress if available
        if (data.progress) {
          // Update active business app progress state
          setActiveBusinessAppProgress({
            stage: data.progress.stage,
            progress: data.progress.progress,
            message: data.progress.message,
            detailedStatus: data.progress.detailedStatus,
            stageMetadata: data.progress.stageMetadata,
            currentAttempt: data.progress.currentAttempt,
            maxAttempts: data.progress.maxAttempts
          });

          if (data.progress.availableStages && !generationStages) {
            setGenerationStages(data.progress.availableStages);
          }

          setUniversalMessages(prevMessages =>
            prevMessages.map(msg => {
              if (msg.isProcessing) {
                return {
                  ...msg,
                  isBusinessAppContent: true,
                  messageData: {
                    type: "business_app_generation",
                    stage: data.progress.stage,
                    progress: data.progress.progress,
                    message: data.progress.message,
                    detailedStatus: data.progress.detailedStatus,
                    stageMetadata: data.progress.stageMetadata,
                    currentAttempt: data.progress.currentAttempt,
                    maxAttempts: data.progress.maxAttempts
                  }
                };
              }
              return msg;
            })
          );
        }
        // Continue polling
        const timerId = setTimeout(() => pollUniversalRequestStatus(requestId), POLLING_INTERVAL);
        setUniversalPollingTimer(timerId);
      }

    } catch (error) {
      console.error("Error polling universal request status:", error);

      setUniversalPollingTimer(null);
      setUniversalActiveRequestId(null);
      setUniversalIsLoading(false);

      setUniversalMessages(prevMessages =>
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
      if (contextType === CONTEXT_TYPES.BPMN_EDITOR) {
        // Update context before sending request
        const contextHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.UPDATE_CONTEXT_BEFORE_REQUEST);
        if (typeof contextHandler === "function") {
          await new Promise(resolve => contextHandler(resolve));
        }

        // Get context data for BPMN editor
        const contextData = editorContextService.getContextData();
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

        // Start polling for request status
        setActiveRequestId(requestId);
        pollRequestStatus(requestId);

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
        clearTimeout(pollingTimer);
        setPollingTimer(null);
      }

      setActiveRequestId(null);
    }
  };

  const handleKeyDown = (e, isUniversal) => {
    // Handle autocomplete navigation with arrow keys
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

    // Submit message on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isUniversal) {
        handleUniversalSubmit(e);
      } else {
        handleContextualSubmit(e);
      }
    }
  };

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
        label: "карточка",
        icon: "fa-database",
        description: recordDescription,
        disabled: isCurrentRecordInContext,
        isCurrentRecord: true
      }
    ];

    // Add available documents
    if (availableDocuments.length > 0) {
      const filteredDocuments = availableDocuments.filter(doc =>
        autocompleteQuery.length === 0 ||
        doc.displayName.toLowerCase().includes(autocompleteQuery.toLowerCase())
      );

      const documentOptions = filteredDocuments.map(doc => {
        const isInContext = additionalContext.documents.some(
          contextDoc => contextDoc.recordRef === doc.recordRef
        );

        return {
          type: ADDITIONAL_CONTEXT_TYPES.DOCUMENTS,
          label: doc.displayName,
          icon: "fa-file-o",
          description: `Добавить документ "${doc.displayName}"${isInContext ? " (уже добавлен)" : ""}`,
          disabled: isInContext,
          recordData: doc,
          isDocument: true
        };
      });

      contextOptions.push(...documentOptions);
    }

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
      option.isDocument ||
      autocompleteQuery.length >= AUTOCOMPLETE_QUERY_THRESHOLD ||
      option.label.toLowerCase().includes(autocompleteQuery.toLowerCase())
    );
  };

  const getContextTitle = () => {
    const context = editorContextService.getContext();
    switch (context) {
      case CONTEXT_TYPES.BPMN_EDITOR:
        return "BPMN Редактор";
      default:
        return "Нет контекста";
    }
  };

  const getContextHint = () => {
    const context = editorContextService.getContext();
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
              <div className="ai-assistant-chat__capability">
                <strong>✉️ Письма:</strong> составление деловых писем
              </div>
              <div className="ai-assistant-chat__capability">
                <strong>👥 Клиент 360:</strong> анализ клиентов, сделок, заказов, платежей
              </div>

              <p className="ai-assistant-chat__hint">
                <strong>Примеры запросов:</strong><br />
                • "Создай тип данных для заявки на отпуск"<br />
                • "Проанализируй документ @карточка"<br />
                • "Расскажи о клиенте @карточка"<br />
                • "Проанализируй документ @название_документа"<br />
                • "Что ты умеешь делать?"
              </p>

              <p className="ai-assistant-chat__tip">
                💡 Используйте <code>@</code> для добавления записей и документов в контекст
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
            "ai-assistant-chat__message--email": msg.isEmailContent,
            "ai-assistant-chat__message--text-diff": msg.isTextDiffContent,
            "ai-assistant-chat__message--business-app": msg.isBusinessAppContent
          }
        )}
      >
        <div className="ai-assistant-chat__message-content">
          {msg.isEmailContent && msg.messageData ? (
            <div className="ai-assistant-chat__email-preview">
              <div className="ai-assistant-chat__email-subject">
                <strong>Тема:</strong> {msg.messageData.subject}
              </div>
              <div className="ai-assistant-chat__email-body">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {msg.messageData.body.replace(/\n/g, "  \n")}
                </Markdown>
              </div>
              {msg.messageData.to && (
                <div className="ai-assistant-chat__email-recipient">
                  <strong>Получатель:</strong> {msg.messageData.to}
                </div>
              )}
            </div>
          ) : msg.isTextDiffContent && msg.messageData ? (
            <div className="ai-assistant-chat__text-diff-preview">
              <div className="ai-assistant-chat__text-diff-description">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {msg.text}
                </Markdown>
              </div>
              <DiffViewer
                original={msg.messageData.originalPlainText || ""}
                modified={msg.messageData.modifiedPlainText || ""}
                attributeName={msg.messageData.attributeName}
                onApplyChanges={() => handleApplyTextChanges(msg.messageData)}
                isApplying={isApplyingTextChanges}
              />
            </div>
          ) : msg.isBusinessAppContent && msg.messageData ? (
            <>
              {msg.messageData.stage === 'COMPLETED' ? (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {msg.text}
                </Markdown>
              ) : (
                (() => {
                  const stageMetadata = msg.messageData.stageMetadata || {};
                  const isInProgress = msg.messageData.stage !== 'COMPLETED' && !msg.messageData.error;
                  const severity = stageMetadata.severity || "INFO";

                  return (
                    <div className={classNames(
                      "ai-assistant-chat__progress-message",
                      {
                        [`ai-assistant-chat__progress-message--${severity.toLowerCase()}`]: true
                      }
                    )}>
                      {(() => {
                        const label = stageMetadata.label || "Обработка";
                        const icon = stageMetadata.icon || "fa-cog";
                        const description = stageMetadata.description;
                        const animated = stageMetadata.animated !== undefined ? stageMetadata.animated : msg.isProcessing;

                        let color = stageMetadata.color || "#2196F3";
                        if (severity === "ERROR") {
                          color = "#f44336";
                        } else if (severity === "WARNING") {
                          color = "#ff9800";
                        }

                        const spinningIcons = ['fa-cog', 'fa-spinner', 'fa-circle-o-notch', 'fa-refresh', 'fa-sync'];
                        const shouldSpin = animated === true && spinningIcons.includes(icon);

                        return (
                          <>
                            <div className="ai-assistant-chat__progress-header-inline">
                              <Icon
                                className={classNames("fa", icon, {
                                  "fa-spin": shouldSpin
                                })}
                                style={{ color: color }}
                              />
                              <span className="ai-assistant-chat__progress-label">
                                {label}
                              </span>
                              {isInProgress && (
                                <span className="ai-assistant-chat__progress-percentage">
                                  {msg.messageData.progress || 0}%
                                </span>
                              )}
                            </div>

                            {description && (
                              <div className="ai-assistant-chat__progress-description">
                                {description}
                              </div>
                            )}

                            {isInProgress && msg.messageData.progress !== undefined && (
                              <div className="ai-assistant-chat__progress-bar-thin">
                                <div
                                  className="ai-assistant-chat__progress-fill"
                                  style={{
                                    width: `${msg.messageData.progress || 0}%`,
                                    backgroundColor: color,
                                    transition: 'width 0.5s ease-in-out'
                                  }}
                                />
                              </div>
                            )}

                            {msg.messageData.currentAttempt > 1 && msg.messageData.maxAttempts && (
                              <div className="ai-assistant-chat__progress-attempts">
                                Попытка {msg.messageData.currentAttempt} из {msg.messageData.maxAttempts}
                              </div>
                            )}

                            <div className="ai-assistant-chat__progress-content">
                              <Markdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {msg.messageData.detailedStatus || msg.text || msg.messageData.message}
                              </Markdown>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  );
                })()
              )}

              {msg.messageData.artifacts && msg.messageData.artifacts.length > 0 && (
                <div className="ai-assistant-chat__artifacts">
                  <div className="ai-assistant-chat__artifacts-header">
                    <Icon className="fa fa-check-circle" />
                    <span>Созданные артефакты:</span>
                  </div>
                  <div className="ai-assistant-chat__artifacts-list">
                    {msg.messageData.artifacts.map((artifact, index) => {
                      const displayName = artifact.type?.displayName || '';
                      const icon = artifact.type?.icon || '';

                      return (
                        <div key={index} className="ai-assistant-chat__artifact-item">
                          <Icon className={`fa ${icon}`} />
                          <a
                            href={artifact.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ai-assistant-chat__artifact-link"
                          >
                            {artifact.name}
                          </a>
                          <span className="ai-assistant-chat__artifact-type">
                            {displayName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {msg.text}
            </Markdown>
          )}
        </div>
        {msg.isProcessing && msg.pollingIsUsed && (
          <div className="ai-assistant-chat__cancel-action">
            <button
              className="ai-assistant-chat__action-button ai-assistant-chat__action-button--cancel"
              onClick={activeTab === TAB_TYPES.UNIVERSAL ? cancelUniversalActiveRequest : cancelActiveRequest}
            >
              Отменить
            </button>
          </div>
        )}
        {msg.isEmailContent && msg.messageData && (
          <div className="ai-assistant-chat__email-actions">
            <button
              className="ai-assistant-chat__action-button ai-assistant-chat__action-button--copy"
              onClick={() => handleCopyEmail(msg.messageData)}
              title="Скопировать"
            >
              <Icon className="fa fa-copy" />
              Скопировать
            </button>
            <button
              className="ai-assistant-chat__action-button ai-assistant-chat__action-button--send"
              onClick={() => handleSendEmail(msg.messageData)}
              title="Отправить"
            >
              <Icon className="fa fa-send" />
              Отправить
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
    if (selectedAdditionalContext.length === 0 && !selectedTextContext && uploadedFiles.length === 0 && uploadingFiles.length === 0) return null;

    return (
      <div className="ai-assistant-chat__context-tags">
        {selectedTextContext && (
          <div className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--selected-text">
            <span>
              Текст: "{selectedTextContext.text.length > 50
                ? selectedTextContext.text.substring(0, 50) + '...'
                : selectedTextContext.text}"
            </span>
            <button
              className="ai-assistant-chat__context-tag-remove"
              onClick={removeSelectedTextContext}
              title="Удалить текст из контекста"
            >
              <Icon className="fa fa-times" />
            </button>
          </div>
        )}
        {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) &&
          additionalContext.records.map((record, index) => (
            <div key={`${ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD}-${index}`} className="ai-assistant-chat__context-tag">
              <span>{record.displayName || record.recordRef || "Карточка"}</span>
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
        {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) &&
          additionalContext.documents.map((document, index) => (
            <div key={`${ADDITIONAL_CONTEXT_TYPES.DOCUMENTS}-${index}`}
                 className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--document">
              <span>{document.displayName || document.recordRef || "Документ"}</span>
              <button
                className="ai-assistant-chat__context-tag-remove"
                onClick={() => toggleAdditionalContext(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS, document)}
                title="Удалить документ из контекста"
              >
                <Icon className="fa fa-times" />
              </button>
            </div>
          ))
        }
        {selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES) &&
          additionalContext.attributes.map((attribute, index) => (
            <div key={`${ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES}-${index}`}
                 className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--attribute">
              <span>{"Атрибут: " + attribute.displayName || attribute.attribute}</span>
              <button
                className="ai-assistant-chat__context-tag-remove"
                onClick={() => toggleAdditionalContext(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES, attribute)}
                title="Удалить атрибут из контекста"
              >
                <Icon className="fa fa-times" />
              </button>
            </div>
          ))
        }
        {uploadingFiles.map((file) => (
          <div key={file.id} className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--uploaded-file">
            <Icon className="fa fa-spinner fa-spin" />
            <span>{file.name}</span>
          </div>
        ))}
        {uploadedFiles.map((file, index) => (
          <div key={`uploaded-file-${index}`} className="ai-assistant-chat__context-tag ai-assistant-chat__context-tag--uploaded-file">
            <Icon className="fa fa-file" />
            <span>{file.name}</span>
            <button
              className="ai-assistant-chat__context-tag-remove"
              onClick={() => removeUploadedFile(file)}
              title="Удалить файл"
            >
              <Icon className="fa fa-times" />
            </button>
          </div>
        ))}
      </div>
    );
  };

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

  const handleInputChange = (e, isUniversal) => {
    const value = e.target.value;
    const currentSetMessage = isUniversal ? setUniversalMessage : setContextualMessage;
    currentSetMessage(value);

    // Handle @ autocomplete only in universal chat
    if (isUniversal) {
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      // Check if @ symbol was typed and no space after it
      if (lastAtIndex !== -1) {
        const queryAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (queryAfterAt.length >= 0 && !queryAfterAt.includes(" ")) {
          setAutocompleteQuery(queryAfterAt);
          setSelectedAutocompleteIndex(0);
          setShowAutocomplete(true);

          // Load current record for autocomplete
          getAdditionalContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD)
            .then(data => {
              setCurrentRecordForAutocomplete(data);

              // Search for records if query length exceeds threshold
              if (queryAfterAt.length >= AUTOCOMPLETE_QUERY_THRESHOLD && data && data.type) {
                searchRecordsByDisp(queryAfterAt, data.type)
                  .then(results => {
                    setSearchResults(results);
                  });
              } else {
                setSearchResults([]);
              }
            });

          // Load available documents for autocomplete
          getAdditionalContext(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS)
            .then(docs => {
              setAvailableDocuments(docs || []);
            });

          // Calculate autocomplete position relative to cursor
          const textarea = e.target;
          const rect = textarea.getBoundingClientRect();

          const textBeforeCursor = value.substring(0, cursorPosition);
          const lines = textBeforeCursor.split("\n");
          const currentLineIndex = lines.length - 1;
          const currentLineText = lines[currentLineIndex];

          const lineHeight = 20;
          const charWidth = 8;
          const padding = 12;

          const top = rect.top + padding + (currentLineIndex * lineHeight) + lineHeight + 5;
          const left = rect.left + padding + (currentLineText.length * charWidth);

          setAutocompletePosition({
            top: Math.min(top, window.innerHeight - 200),
            left: Math.min(left, window.innerWidth - 300)
          });
        } else {
          setShowAutocomplete(false);
          setSelectedAutocompleteIndex(0);
          setSearchResults([]);
          setAvailableDocuments([]);
        }
      } else {
        setShowAutocomplete(false);
        setSelectedAutocompleteIndex(0);
        setSearchResults([]);
        setAvailableDocuments([]);
      }
    }
  };

  const insertContextMention = async (contextType, recordData = null) => {
    let contextLabel = "карточка";
    let contextDataToAdd = null;

    if (contextType === "search_result" && recordData) {
      contextLabel = recordData.displayName || recordData.recordRef;
      contextDataToAdd = recordData;
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) {
      const contextData = await getAdditionalContext(contextType);
      if (contextData) {
        contextLabel = contextData.displayName || contextData.recordRef || "карточка";
        contextDataToAdd = contextData;
      }
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS && recordData) {
      contextLabel = recordData.displayName || recordData.recordRef;
      contextDataToAdd = recordData;
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES && recordData) {
      contextLabel = recordData.displayName || recordData.attribute;
      contextDataToAdd = recordData;
    }

    // Replace @ mention with context label
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
    setAvailableDocuments([]);

    // Set cursor position after the inserted mention
    setTimeout(() => {
      if (universalTextareaRef.current) {
        const newCursorPosition = lastAtIndex + contextLabel.length + 2;
        universalTextareaRef.current.focus();
        universalTextareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);

    // Add context data to additional context
    if (contextDataToAdd) {
      if (contextType === "search_result") {
        setAdditionalContext(prev => ({
          ...prev,
          records: [...prev.records, contextDataToAdd]
        }));

        if (!selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD)) {
          setSelectedAdditionalContext(prev => [...prev, ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD]);
        }
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) {
        toggleAdditionalContext(contextType, contextDataToAdd);
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES) {
        setAdditionalContext(prev => ({
          ...prev,
          attributes: [...prev.attributes, contextDataToAdd]
        }));
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

  useEffect(() => {
    const checkCurrentRecord = async () => {
      if (isOpen && !isMinimized) {
      }
    };

    checkCurrentRecord();
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!isOpen || isMinimized) {
      setShowAutocomplete(false);
      setSelectedAutocompleteIndex(0);
      setSearchResults([]);
      setAvailableDocuments([]);
      setIsSearching(false);
    }
  }, [isOpen, isMinimized]);

  const uploadFileToRecords = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      const response = await ecosXhr('/gateway/emodel/api/ecos/webapp/content', {
        method: 'POST',
        body: formData
      });

      const { entityRef = null } = response;
      if (!entityRef) {
        throw new Error('No file entityRef received');
      }

      return {
        recordRef: entityRef,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);

    const filesToUpload = Array.from(files).map((file, index) => ({
      id: `uploading-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      isUploading: true,
      file: file
    }));

    // Validate file types and sizes
    for (const fileData of filesToUpload) {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = '.' + fileData.name.split('.').pop().toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        NotificationManager.error(`Неподдерживаемый тип файла: ${fileExtension}. Разрешены: ${allowedTypes.join(', ')}`, 'Загрузка файлов');
        setIsUploadingFile(false);
        return;
      }

      if (fileData.size > 10 * 1024 * 1024) {
        NotificationManager.error(`Файл слишком большой: ${(fileData.size / 1024 / 1024).toFixed(1)}MB. Максимум: 10MB`, 'Загрузка файлов');
        setIsUploadingFile(false);
        return;
      }
    }

    setUploadingFiles(prev => [...prev, ...filesToUpload]);

    try {
      // Upload files one by one and update state
      for (const fileData of filesToUpload) {
        try {
          const uploadedFileRef = await uploadFileToRecords(fileData.file);

          // Remove from uploading and add to uploaded
          setUploadingFiles(prev => prev.filter(f => f.id !== fileData.id));
          setUploadedFiles(prev => [...prev, uploadedFileRef]);
        } catch (error) {
          // Remove from uploading on error
          setUploadingFiles(prev => prev.filter(f => f.id !== fileData.id));
          console.error('Error uploading file:', fileData.name, error);
          NotificationManager.error(`Ошибка загрузки файла "${fileData.name}": ${error.message}`, 'Загрузка файлов');
        }
      }
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    // Only handle file drops on universal tab
    if (activeTab !== TAB_TYPES.UNIVERSAL) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();

    // Only allow drag over on universal tab
    if (activeTab !== TAB_TYPES.UNIVERSAL) return;

    if (!dragOver) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();

    // Only handle drag leave on universal tab
    if (activeTab !== TAB_TYPES.UNIVERSAL) return;

    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const removeUploadedFile = (fileToRemove) => {
    setUploadedFiles(prev => prev.filter(f => f.recordRef !== fileToRemove.recordRef));
  };

  const handleCopyEmail = (emailData) => {
    // Copy email body to clipboard
    if (emailData && emailData.body) {
      navigator.clipboard.writeText(emailData.body).then(() => {
      }).catch(err => {
        console.error("Failed to copy email: ", err);
      });
    }
  };

  const handleSendEmail = (emailData) => {
    // Open email modal with pre-filled data
    if (emailData) {
      setEmailFormData({
        to: emailData.to || "",
        subject: emailData.subject || "",
        body: emailData.body || "",
        addToActivities: true
      });
      setShowEmailModal(true);
    }
  };

  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    setIsEmailSending(false);
    setEmailFormData({
      to: "",
      subject: "",
      body: "",
      addToActivities: true
    });
  };

  const handleEmailSend = async () => {
    if (isEmailSending) {
      return;
    }

    setIsEmailSending(true);

    try {
      const response = await fetch("/gateway/ai/api/assistant/send-mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: emailFormData.to,
          subject: emailFormData.subject,
          body: emailFormData.body,
          addToActivities: emailFormData.addToActivities,
          recordRef: getRecordRef() || null
        })
      });

      if (!response.ok) {
        let errorMessage = `Ошибка отправки письма (${response.status})`;

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }

        console.error("Error sending email:", errorMessage);
        NotificationManager.error(errorMessage, "Ошибка отправки");
        return;
      }

      const result = await response.json();
      if (!result.success) {
        const errorMessage = result.message || "Неизвестная ошибка при отправке письма";
        console.error("Error sending email:", errorMessage);
        NotificationManager.error(errorMessage, "Ошибка отправки");
        return;
      }

      NotificationManager.success("Письмо успешно отправлено", "Отправка письма");
      handleEmailModalClose();
    } catch (error) {
      console.error("Error sending email:", error);
      NotificationManager.error(
        error.message || "Произошла ошибка при отправке письма. Попробуйте еще раз.",
        "Ошибка отправки"
      );
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleApplyTextChanges = async (diffData) => {
    if (!diffData || !diffData.recordRef || !diffData.attribute) {
      console.error("Invalid diff data for applying changes");
      return;
    }

    setIsApplyingTextChanges(true);

    try {
      const recordRef = diffData.recordRef;
      const attribute = diffData.attribute;
      const newText = diffData.modifiedText;

      if (!newText) {
        throw new Error("Нет данных для применения изменений");
      }

      // Check if changes should be applied via editor handler or Records API
      const contextData = editorContextService.getContextData();
      if (contextData.forceIntent === AI_INTENTS.TEXT_EDITING) {
        const updateLexicalContentHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.UPDATE_LEXICAL_CONTENT);

        // Apply changes directly in editor if context matches
        if (contextData.recordRef === recordRef && contextData.attribute === attribute && updateLexicalContentHandler) {
          updateLexicalContentHandler(newText);
          NotificationManager.success("Изменения успешно применены в редакторе", "Редактирование текста");
        } else {
          await applyChangesViaRecordsAPI(recordRef, attribute, newText);
        }
      } else {
        await applyChangesViaRecordsAPI(recordRef, attribute, newText);
      }
    } catch (error) {
      console.error("Error applying text changes:", error);
      NotificationManager.error(
        error.message || "Произошла ошибка при применении изменений. Попробуйте еще раз.",
        "Ошибка применения изменений"
      );
    } finally {
      setIsApplyingTextChanges(false);
    }
  };

  const applyChangesViaRecordsAPI = async (recordRef, attribute, newText) => {
    // Extract record ID from ref
    const recordId = recordRef.substring(recordRef.indexOf("@") + 1);
    if (!recordId) {
      NotificationManager.error("Редактор не найден или документ не сохранен", "Ошибка применения изменений");
      return;
    }

    // Update record attribute and save
    const recordToSave = Records.get(recordRef);
    recordToSave.att(attribute, newText);
    await recordToSave.save();

    // Notify listeners about attribute update
    recordToSave.events.emit(EVENTS.ATTS_UPDATED);

    NotificationManager.success("Изменения успешно применены", "Редактирование текста");
  };

  const searchRecordsByDisp = async (query, recordType) => {
    if (!query || query.length < AUTOCOMPLETE_QUERY_THRESHOLD) {
      return [];
    }

    try {
      setIsSearching(true);

      // Extract record type ID
      let recordTypeId = "";
      const atIndex = recordType.indexOf("@");
      if (atIndex !== -1) {
        recordTypeId = recordType.substring(atIndex + 1);
      }

      const rType = SourcesId.RESOLVED_TYPE + "@" + recordTypeId;

      // Load source ID for the type
      let sourceId;
      try {
        sourceId = await Records.get(rType).load("sourceId");
      } catch (e) {
        console.error("Error loading sourceId for type:", rType, e);
      }

      // Build search query
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

  const currentRealTimeContext = editorContextService.getContext();
  const hasContext = !!currentRealTimeContext && currentRealTimeContext !== CONTEXT_TYPES.UNIVERSAL;
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
        <div
          className={classNames(
            "ai-assistant-chat ai-assistant-chat--tabs",
            {
              "minimized": isMinimized,
              "ai-assistant-chat--drag-over": dragOver
            }
          )}
          ref={chatRef}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
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
                  <span>
                    {activeBusinessAppProgress && activeTab === TAB_TYPES.UNIVERSAL
                      ? 'Генерация бизнес-приложения'
                      : 'Универсальный помощник'}
                  </span>
                  {/* Business App Generation Progress Timeline */}
                  {activeBusinessAppProgress && activeTab === TAB_TYPES.UNIVERSAL && generationStages && (
                    <div className="ai-assistant-chat__stage-timeline">
                      {generationStages.map((stage, index) => {
                        const status = getStageStatus(stage.key, activeBusinessAppProgress.progress || 0, stage.progressRange);
                        const isLast = index === generationStages.length - 1;

                        return (
                          <div
                            key={stage.key}
                            className={classNames(
                              "ai-assistant-chat__stage-timeline-item",
                              {
                                "ai-assistant-chat__stage-timeline-item--completed": status === 'completed',
                                "ai-assistant-chat__stage-timeline-item--active": status === 'active',
                                "ai-assistant-chat__stage-timeline-item--pending": status === 'pending'
                              }
                            )}
                          >
                            <div className="ai-assistant-chat__stage-timeline-marker">
                              {status === 'completed' && <Icon className="fa fa-check" />}
                              {status === 'active' && <span className="ai-assistant-chat__stage-timeline-pulse" />}
                              {status === 'pending' && <span className="ai-assistant-chat__stage-timeline-dot" />}
                            </div>
                            <div className="ai-assistant-chat__stage-timeline-label">{stage.label}</div>
                            {!isLast && <div className="ai-assistant-chat__stage-timeline-connector" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
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

                {currentIsLoading && !activeRequestId && !universalActiveRequestId && (
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
                      <div className="ai-assistant-chat__input-actions">
                        <button
                          type="button"
                          className="ai-assistant-chat__floating-action ai-assistant-chat__floating-action--file-upload"
                          onClick={handleFileUploadClick}
                          disabled={isUploadingFile}
                          data-tooltip={isUploadingFile ? "Загрузка..." : "Загрузить файл"}
                        >
                          <Icon className={isUploadingFile ? "fa fa-spinner fa-spin" : "fa fa-paperclip"} />
                        </button>
                        <button
                          type="button"
                          className="ai-assistant-chat__floating-action ai-assistant-chat__floating-action--clear-context"
                          onClick={clearUniversalConversation}
                          data-tooltip="Очистить контекст"
                        >
                          <Icon className="fa fa-trash-o" />
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.doc,.rtf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </ResizableBox>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="ai-assistant-email-modal-overlay">
          <div className="ai-assistant-email-modal">
            <div className="ai-assistant-email-modal__header">
              <h3>Отправить</h3>
              <button
                className="ai-assistant-email-modal__close"
                onClick={handleEmailModalClose}
              >
                <Icon className="fa fa-times" />
              </button>
            </div>
            <div className="ai-assistant-email-modal__content">
              <div className="ai-assistant-email-modal__field">
                <label>Получатель:</label>
                <input
                  type="email"
                  value={emailFormData.to}
                  onChange={(e) => setEmailFormData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="ai-assistant-email-modal__field">
                <label>Тема:</label>
                <input
                  type="text"
                  value={emailFormData.subject}
                  onChange={(e) => setEmailFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Тема письма"
                />
              </div>
              <div className="ai-assistant-email-modal__field">
                <label>Сообщение:</label>
                <textarea
                  value={emailFormData.body}
                  onChange={(e) => setEmailFormData(prev => ({ ...prev, body: e.target.value }))}
                  rows="10"
                  placeholder="Текст письма"
                />
              </div>
              <div className="ai-assistant-email-modal__field ai-assistant-email-modal__field--checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={emailFormData.addToActivities}
                    onChange={(e) => setEmailFormData(prev => ({ ...prev, addToActivities: e.target.checked }))}
                  />
                  <span>Добавить письмо в активности</span>
                </label>
              </div>
            </div>
            <div className="ai-assistant-email-modal__actions">
              <button
                className="ai-assistant-email-modal__button ai-assistant-email-modal__button--cancel"
                onClick={handleEmailModalClose}
              >
                Отмена
              </button>
              <button
                className="ai-assistant-email-modal__button ai-assistant-email-modal__button--send"
                onClick={handleEmailSend}
                disabled={!emailFormData.to || !emailFormData.subject || !emailFormData.body || isEmailSending}
              >
                {isEmailSending ? (
                  <>
                    <Icon className="fa fa-spinner fa-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon className="fa fa-send" />
                    Отправить
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantChat;
