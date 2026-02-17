import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import classNames from "classnames";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

import aiAssistantService from "./AIAssistantService";
import editorContextService, { CONTEXT_TYPES } from "./EditorContextService";
import {
  AI_INTENTS,
  EDITOR_CONTEXT_HANDLERS,
  API_ENDPOINTS,
  TAB_TYPES,
  getScriptContextLabel
} from "./constants";
import { Icon } from "../common";
import Records from "../Records";
import { getRecordRef } from "@/helpers/urls";
import { IS_APPLE, useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { NotificationManager } from "@/services/notifications";
import MermaidDiagram from "./MermaidDiagram";
import "./styles/index.scss";
import { EVENTS } from "@/components/widgets/BaseWidget";

// Hooks
import {
  useChatResize,
  useFileUpload,
  useWindowManagement,
  useAdditionalContext,
  useAutocomplete,
  useUniversalChat,
  useContextualChat
} from "./hooks";

// Components
import {
  ChatHeader,
  ChatTabs,
  ChatInput,
  ChatContextTags,
  EmailModal,
  MessageList
} from "./components";

import { getStageStatus } from "./utils";

const AIAssistantChat = () => {
  const [activeTab, setActiveTab] = useState(TAB_TYPES.UNIVERSAL);
  const [contextType, setContextType] = useState(() => editorContextService.getContext());

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    to: "",
    subject: "",
    body: "",
    addToActivities: true
  });

  // Text/Script diff state
  const [isApplyingTextChanges, setIsApplyingTextChanges] = useState(false);
  const [isApplyingScriptChanges, setIsApplyingScriptChanges] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const universalTextareaRef = useRef(null);
  const contextualTextareaRef = useRef(null);
  const chatRef = useRef(null);
  const setMessageRef = useRef(null);

  // Custom hooks
  const { isOpen, isMinimized, handleClose: baseHandleClose, handleMinimize } = useWindowManagement();
  const { chatSize, handleResize } = useChatResize();

  // Context added callback - switches to universal tab and focuses
  const handleContextEvent = useCallback(() => {
    setActiveTab(TAB_TYPES.UNIVERSAL);
    setTimeout(() => {
      universalTextareaRef.current?.focus();
    }, 50);
  }, []);

  // Wrapper function that uses ref to access setMessage after it's available
  const setMessageWrapper = useCallback((value) => {
    setMessageRef.current?.(value);
  }, []);

  const additionalContextHook = useAdditionalContext({
    setMessage: setMessageWrapper,
    onContextAdded: handleContextEvent,
    onTextReferenceAdded: handleContextEvent,
    onScriptContextAdded: handleContextEvent
  });
  const {
    additionalContext,
    selectedAdditionalContext,
    selectedTextContext,
    scriptContext,
    toggleAdditionalContext,
    getAdditionalContext,
    addRecordToContext,
    removeSelectedTextContext,
    removeScriptContext,
    clearAllContext
  } = additionalContextHook;

  const fileUploadHook = useFileUpload();
  const {
    uploadedFiles,
    uploadingFiles,
    dragOver,
    isUploadingFile,
    handleFileUpload,
    handleFileDrop,
    handleDragOver,
    handleDragLeave,
    removeUploadedFile,
    clearUploadedFiles,
    fileInputRef
  } = fileUploadHook;

  const universalChatHook = useUniversalChat({
    additionalContext,
    uploadedFiles,
    clearUploadedFiles,
    clearAllContext
  });

  // Store setMessage in ref after hook is created
  setMessageRef.current = universalChatHook.setMessage;

  const contextualChatHook = useContextualChat({ contextType });

  const autocompleteHook = useAutocomplete({
    getAdditionalContext,
    toggleAdditionalContext,
    addRecordToContext,
    additionalContext,
    selectedAdditionalContext
  });

  // Current chat based on active tab
  const currentChat = activeTab === TAB_TYPES.UNIVERSAL ? universalChatHook : contextualChatHook;
  const currentTextareaRef = activeTab === TAB_TYPES.UNIVERSAL ? universalTextareaRef : contextualTextareaRef;

  // Markdown components - memoized
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

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  }), []);

  // Keyboard shortcut for opening chat
  const useAIAssistantShortcut = (callback, deps = []) => {
    const modifiers = IS_APPLE
      ? { meta: true, alt: false, shift: false, ctrl: false }
      : { meta: false, alt: true, shift: false, ctrl: false };
    useKeyboardShortcut("i", modifiers, callback, deps);
  };

  useAIAssistantShortcut(() => {
    aiAssistantService.toggleChat();
  });

  // Enhanced close handler
  const handleClose = useCallback(() => {
    if (universalChatHook.activeRequestId) {
      universalChatHook.cancelRequest();
    }
    if (contextualChatHook.activeRequestId) {
      contextualChatHook.cancelRequest();
    }
    removeSelectedTextContext();
    baseHandleClose();
  }, [universalChatHook, contextualChatHook, baseHandleClose, removeSelectedTextContext]);

  const { clearMessages: clearContextualMessages } = contextualChatHook;

  // Context change detection
  useEffect(() => {
    const checkContext = () => {
      const currentContext = editorContextService.getContext();
      if (currentContext !== contextType) {
        setContextType(currentContext);
        clearContextualMessages();
        if (!currentContext && activeTab === TAB_TYPES.CONTEXTUAL) {
          setActiveTab(TAB_TYPES.UNIVERSAL);
        }
      }
    };
    const intervalId = setInterval(checkContext, 500);
    return () => clearInterval(intervalId);
  }, [contextType, activeTab, clearContextualMessages]);

  // Set active tab based on context when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const currentContext = editorContextService.getContext();
      if (!currentContext || currentContext === CONTEXT_TYPES.UNIVERSAL) {
        setActiveTab(TAB_TYPES.UNIVERSAL);
      } else {
        setActiveTab(TAB_TYPES.CONTEXTUAL);
      }
    }
  }, [isOpen, isMinimized]);

  // Focus management
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        currentTextareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized, activeTab, currentTextareaRef]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat.messages]);

  // Email handlers
  const handleCopyEmail = useCallback((emailData) => {
    if (emailData?.body) {
      navigator.clipboard.writeText(emailData.body).catch(err => {
        console.error("Failed to copy email:", err);
      });
    }
  }, []);

  const handleSendEmail = useCallback((emailData) => {
    if (emailData) {
      setEmailFormData({
        to: emailData.to || "",
        subject: emailData.subject || "",
        body: emailData.body || "",
        addToActivities: true
      });
      setShowEmailModal(true);
    }
  }, []);

  const handleEmailModalClose = useCallback(() => {
    setShowEmailModal(false);
    setIsEmailSending(false);
    setEmailFormData({ to: "", subject: "", body: "", addToActivities: true });
  }, []);

  const handleEmailSend = useCallback(async () => {
    if (isEmailSending) return;
    setIsEmailSending(true);

    try {
      const response = await fetch(API_ENDPOINTS.SEND_MAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...emailFormData,
          recordRef: getRecordRef() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка отправки письма (${response.status})`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Неизвестная ошибка при отправке письма");
      }

      NotificationManager.success("Письмо успешно отправлено", "Отправка письма");
      handleEmailModalClose();
    } catch (error) {
      NotificationManager.error(error.message, "Ошибка отправки");
    } finally {
      setIsEmailSending(false);
    }
  }, [emailFormData, isEmailSending, handleEmailModalClose]);

  // Text diff handler
  const handleApplyTextChanges = useCallback(async (diffData) => {
    if (!diffData?.recordRef || !diffData?.attribute) return;
    setIsApplyingTextChanges(true);

    try {
      const { recordRef, attribute, modifiedText: newText } = diffData;
      if (!newText) throw new Error("Нет данных для применения изменений");

      const contextData = editorContextService.getContextData();
      if (contextData.forceIntent === AI_INTENTS.TEXT_EDITING) {
        const updateHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.UPDATE_LEXICAL_CONTENT);
        if (contextData.recordRef === recordRef && contextData.attribute === attribute && updateHandler) {
          updateHandler(newText);
          NotificationManager.success("Изменения успешно применены в редакторе", "Редактирование текста");
        } else {
          await applyChangesViaRecordsAPI(recordRef, attribute, newText);
        }
      } else {
        await applyChangesViaRecordsAPI(recordRef, attribute, newText);
      }
    } catch (error) {
      NotificationManager.error(error.message || "Ошибка при применении изменений", "Ошибка");
    } finally {
      setIsApplyingTextChanges(false);
    }
  }, []);

  const applyChangesViaRecordsAPI = async (recordRef, attribute, newText) => {
    const recordId = recordRef.substring(recordRef.indexOf("@") + 1);
    if (!recordId) {
      NotificationManager.error("Редактор не найден или документ не сохранен", "Ошибка");
      return;
    }
    const recordToSave = Records.get(recordRef);
    recordToSave.att(attribute, newText);
    await recordToSave.save();
    recordToSave.events.emit(EVENTS.ATTS_UPDATED);
    NotificationManager.success("Изменения успешно применены", "Редактирование текста");
  };

  // Script diff handler
  const handleApplyScriptChanges = useCallback(async (scriptData) => {
    if (!scriptData?.modifiedScript) {
      NotificationManager.error("Нет данных для применения изменений", "Ошибка");
      return;
    }
    setIsApplyingScriptChanges(true);

    try {
      const contextData = editorContextService.getContextData();
      if (contextData.forceIntent === AI_INTENTS.SCRIPT_WRITING) {
        const updateHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.UPDATE_SCRIPT_CONTENT);
        if (updateHandler) {
          updateHandler(scriptData.modifiedScript);
          NotificationManager.success("Скрипт успешно обновлен в редакторе", "Редактирование скрипта");
        } else {
          NotificationManager.error("Редактор скрипта не найден. Скопируйте код вручную.", "Ошибка");
        }
      } else {
        NotificationManager.error("Контекст редактора скрипта не найден. Скопируйте код вручную.", "Ошибка");
      }
    } catch (error) {
      NotificationManager.error(error.message || "Ошибка при применении скрипта", "Ошибка");
    } finally {
      setIsApplyingScriptChanges(false);
    }
  }, []);

  // Input handlers
  const handleInputChange = useCallback((e, isUniversal) => {
    const value = e.target.value;
    const setMessage = isUniversal ? universalChatHook.setMessage : contextualChatHook.setMessage;
    setMessage(value);

    if (isUniversal) {
      autocompleteHook.handleAutocompleteInputChange(value, e.target.selectionStart, e.target);
    }
  }, [universalChatHook, contextualChatHook, autocompleteHook]);

  const handleKeyDown = useCallback((e, isUniversal) => {
    if (autocompleteHook.showAutocomplete && isUniversal) {
      const filteredOptions = autocompleteHook.getFilteredAutocompleteOptions();
      const result = autocompleteHook.handleAutocompleteKeyDown(e, filteredOptions);

      if (result && typeof result === 'object') {
        autocompleteHook.insertContextMention(
          result.type,
          result.data,
          universalChatHook.message,
          universalChatHook.setMessage,
          universalTextareaRef
        );
        return;
      }
      if (result) return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      currentChat.handleSubmit(e);
    }
  }, [autocompleteHook, universalChatHook, currentChat]);

  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  // Clear conversation with script context reset
  const handleClearConversation = useCallback(() => {
    universalChatHook.clearConversation();
    removeScriptContext();
  }, [universalChatHook, removeScriptContext]);

  // Helper functions
  const getContextTitle = () => {
    const context = editorContextService.getContext();
    switch (context) {
      case CONTEXT_TYPES.BPMN_EDITOR: return "BPMN Редактор";
      default: return "Нет контекста";
    }
  };

  const getContextHint = () => {
    const context = editorContextService.getContext();
    switch (context) {
      case CONTEXT_TYPES.BPMN_EDITOR:
        return "Например: \"Создай процесс обработки заявки на отпуск\". Чем детальнее описание, тем точнее будет результат.";
      default: return "Контекст не определен";
    }
  };

  if (!isOpen) return null;

  const currentRealTimeContext = editorContextService.getContext();
  const hasContext = !!currentRealTimeContext && currentRealTimeContext !== CONTEXT_TYPES.UNIVERSAL;

  return (
    <div className="ai-assistant-resizable">
      {/* Autocomplete dropdown */}
      {autocompleteHook.showAutocomplete && (
        <div
          className="ai-assistant-chat__autocomplete"
          style={{
            position: "fixed",
            top: autocompleteHook.autocompletePosition.top,
            left: autocompleteHook.autocompletePosition.left,
            zIndex: 105001
          }}
        >
          {autocompleteHook.isSearching && autocompleteHook.autocompleteQuery.length >= 3 && (
            <div className="ai-assistant-chat__autocomplete-item ai-assistant-chat__autocomplete-item--loading">
              <Icon className="fa fa-spinner fa-spin ai-assistant-chat__autocomplete-icon" />
              <div className="ai-assistant-chat__autocomplete-text">
                <div className="ai-assistant-chat__autocomplete-label">Поиск записей...</div>
              </div>
            </div>
          )}
          {autocompleteHook.getFilteredAutocompleteOptions().map((option, index) => (
            <div
              key={`${option.type}-${option.data?.recordRef || "current"}`}
              className={classNames("ai-assistant-chat__autocomplete-item", {
                "ai-assistant-chat__autocomplete-item--disabled": option.disabled,
                "ai-assistant-chat__autocomplete-item--selected": index === autocompleteHook.selectedAutocompleteIndex
              })}
              onClick={() => !option.disabled && autocompleteHook.insertContextMention(
                option.type,
                option.data,
                universalChatHook.message,
                universalChatHook.setMessage,
                universalTextareaRef
              )}
            >
              <Icon className={`fa ${option.icon} ai-assistant-chat__autocomplete-icon`} />
              <div className="ai-assistant-chat__autocomplete-text">
                <div className="ai-assistant-chat__autocomplete-label">@{option.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ResizableBox
        width={chatSize.width}
        height={isMinimized ? 50 : chatSize.height}
        minConstraints={[300, 300]}
        onResize={handleResize}
        resizeHandles={["nw"]}
        disableResize={isMinimized}
      >
        <div
          className={classNames("ai-assistant-chat ai-assistant-chat--tabs", {
            "minimized": isMinimized,
            "ai-assistant-chat--drag-over": dragOver
          })}
          ref={chatRef}
          onDrop={(e) => {
            e.preventDefault();
            if (activeTab === TAB_TYPES.UNIVERSAL) {
              handleFileUpload(e.dataTransfer.files);
            }
            fileUploadHook.handleDragLeave(e);
          }}
          onDragOver={(e) => {
            if (activeTab === TAB_TYPES.UNIVERSAL) {
              handleDragOver(e);
            }
          }}
          onDragLeave={handleDragLeave}
        >
          <ChatHeader
            isMinimized={isMinimized}
            onMinimize={handleMinimize}
            onClose={handleClose}
          />

          {!isMinimized && (
            <>
              <ChatTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                hasContext={hasContext}
                contextTitle={getContextTitle()}
                businessAppProgress={universalChatHook.activeBusinessAppProgress}
                generationStages={universalChatHook.generationStages}
                getStageStatus={getStageStatus}
              />

              <div className="ai-assistant-chat__messages">
                <MessageList
                  messages={currentChat.messages}
                  activeTab={activeTab}
                  contextHint={getContextHint()}
                  markdownComponents={markdownComponents}
                  onCancelRequest={currentChat.cancelRequest}
                  onCopyEmail={handleCopyEmail}
                  onSendEmail={handleSendEmail}
                  onApplyTextChanges={handleApplyTextChanges}
                  onApplyScriptChanges={handleApplyScriptChanges}
                  isApplyingTextChanges={isApplyingTextChanges}
                  isApplyingScriptChanges={isApplyingScriptChanges}
                  isLoading={currentChat.isLoading}
                  activeRequestId={currentChat.activeRequestId}
                  messagesEndRef={messagesEndRef}
                />
              </div>

              <div className="ai-assistant-chat__input-section">
                <form className="ai-assistant-chat__input-container" onSubmit={currentChat.handleSubmit}>
                  {activeTab === TAB_TYPES.UNIVERSAL && (
                    <ChatContextTags
                      selectedAdditionalContext={selectedAdditionalContext}
                      additionalContext={additionalContext}
                      selectedTextContext={selectedTextContext}
                      uploadedFiles={uploadedFiles}
                      uploadingFiles={uploadingFiles}
                      scriptContext={scriptContext}
                      onToggleContext={toggleAdditionalContext}
                      onRemoveSelectedText={removeSelectedTextContext}
                      onRemoveUploadedFile={removeUploadedFile}
                      onRemoveScriptContext={removeScriptContext}
                      getScriptContextLabel={getScriptContextLabel}
                    />
                  )}
                  <ChatInput
                    textareaRef={currentTextareaRef}
                    message={currentChat.message}
                    isLoading={currentChat.isLoading}
                    isUniversal={activeTab === TAB_TYPES.UNIVERSAL}
                    isUploadingFile={isUploadingFile}
                    onInputChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFileUploadClick={handleFileUploadClick}
                    onClearConversation={handleClearConversation}
                    fileInputRef={fileInputRef}
                    onFileUpload={handleFileUpload}
                  />
                </form>
              </div>
            </>
          )}
        </div>
      </ResizableBox>

      {showEmailModal && (
        <EmailModal
          emailFormData={emailFormData}
          isEmailSending={isEmailSending}
          onClose={handleEmailModalClose}
          onSend={handleEmailSend}
          onFieldChange={(field, value) => setEmailFormData(prev => ({ ...prev, [field]: value }))}
        />
      )}
    </div>
  );
};

export default AIAssistantChat;
