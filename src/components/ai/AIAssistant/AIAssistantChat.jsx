import Records from '@citeck/records-core';
import classNames from 'classnames';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';

import aiAssistantService from './AIAssistantService';
import editorContextService, { CONTEXT_TYPES } from './EditorContextService';
import MermaidDiagram from './MermaidDiagram';
import { ChatHeader, ChatTabs, ChatInput, ChatContextTags, EmailModal, MessageList } from './components';
import { AI_INTENTS, EDITOR_CONTEXT_HANDLERS, TAB_TYPES, getScriptContextLabel } from './constants';
import { exportChat } from './exportChatHistory';
import {
  useChatResize,
  useFileUpload,
  useWindowManagement,
  useAdditionalContext,
  useAutocomplete,
  useUniversalChat,
  useContextualChat,
  useEmailSend
} from './hooks';
import { applyAgentSwitch, getStageStatus, isContextRemoval } from './utils';

import { Icon } from '@/components/common';
import { EVENTS } from '@/components/dashboard/widgets/BaseWidget';
import { t } from '@/helpers/export/util';
import { IS_APPLE, useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { NotificationManager } from '@/services/notifications';

import 'react-resizable/css/styles.css';
import './styles/index.scss';

// Only props known to ResizableBox may be passed to it: react-resizable@3 spreads the rest onto its
// inner `<div>`, and an unknown one (previously `disableResize`) reaches the DOM and produces a
// React warning. Resizing is switched off by an empty handle list instead. Both lists are module
// constants so the minimized/expanded switch is the only thing that changes the prop identity.
const CORNER_RESIZE_HANDLE = ['nw'];
const NO_RESIZE_HANDLES = [];

// Hook to detect if device is mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

const AIAssistantChat = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(TAB_TYPES.UNIVERSAL);
  const [contextType, setContextType] = useState(() => editorContextService.getContext());

  // Text/Script diff state
  const [isApplyingTextChanges, setIsApplyingTextChanges] = useState(false);
  const [isApplyingScriptChanges, setIsApplyingScriptChanges] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const prevMessagesCountRef = useRef(0);
  const universalTextareaRef = useRef(null);
  const contextualTextareaRef = useRef(null);
  const chatRef = useRef(null);
  const setMessageRef = useRef(null);

  // Custom hooks
  const { isOpen, isMinimized, isVisible, handleClose: baseHandleClose, handleMinimize } = useWindowManagement();
  const { chatSize, handleResize } = useChatResize();

  // Context added callback - switches to universal tab and focuses
  const handleContextEvent = useCallback(() => {
    setActiveTab(TAB_TYPES.UNIVERSAL);
    setTimeout(() => {
      universalTextareaRef.current?.focus();
    }, 50);
  }, []);

  // Wrapper function that uses ref to access setMessage after it's available
  const setMessageWrapper = useCallback(value => {
    setMessageRef.current?.(value);
  }, []);

  const additionalContextHook = useAdditionalContext({
    isOpen,
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
    workspaceContext,
    toggleAdditionalContext,
    getAdditionalContext,
    addRecordToContext,
    addDocumentToContext,
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
    handleDragOver,
    handleDragLeave,
    removeUploadedFile,
    clearUploadedFiles,
    fileInputRef
  } = fileUploadHook;

  const { showEmailModal, isEmailSending, emailFormData, handleSendEmail, handleEmailModalClose, handleEmailFieldChange, handleEmailSend } =
    useEmailSend();

  const universalChatHook = useUniversalChat({
    additionalContext,
    uploadedFiles,
    clearUploadedFiles,
    // Opening the panel is what resumes a request left running by a reload (D-B-14): the hook is
    // mounted on every page, so restoration must not be tied to its mounting.
    //
    // "Open" here means on screen — `isVisible`, not `isOpen`: `AIAssistantService.toggleChat`
    // minimizes an open panel instead of closing it, so the toolbar button, the `Alt+I` shortcut and
    // the header minimize button all leave `isOpen` true. Keyed on `isOpen` alone, the hint the chat
    // prints on a failed poll — «закройте и снова откройте панель» — did nothing for every one of
    // those controls: only the `×` in the chat header resumed anything, and the stored request id
    // sat unused for the whole resume window.
    isOpen: isVisible,
    clearAllContext
  });

  // Store setMessage in ref after hook is created
  setMessageRef.current = universalChatHook.setMessage;

  const contextualChatHook = useContextualChat({ contextType });

  const autocompleteHook = useAutocomplete({
    getAdditionalContext,
    toggleAdditionalContext,
    addRecordToContext,
    addDocumentToContext,
    additionalContext,
    selectedAdditionalContext,
    // Auto-context chips live in the universal chat hook; without them the @ list would offer a
    // record that is already a chip, and picking it would show the same record twice (D-405-1).
    autoContextArtifacts: universalChatHook.autoContextArtifacts,
    // Minimizing keeps this component mounted and only drops the input form, so the list has to be
    // closed explicitly — see the effect in the hook.
    isPanelVisible: isVisible
  });

  // Current chat based on active tab
  const currentChat = activeTab === TAB_TYPES.UNIVERSAL ? universalChatHook : contextualChatHook;
  const currentTextareaRef = activeTab === TAB_TYPES.UNIVERSAL ? universalTextareaRef : contextualTextareaRef;

  // Markdown components - memoized
  const markdownComponents = useMemo(
    () => ({
      a: ({ node, ...props }) => {
        const href = props.href || '';
        // Journal "link to selection": render a plain in-app SPA anchor (no target=_blank / no ignore
        // attr) so PageTabs' click handler intercepts it, reuses the existing journal tab and pushes the
        // new URL. The journal View then re-applies the userConfig on the userConfigId change. Other chat
        // links keep opening in a new browser tab.
        if (/\/v2\/journals\?/.test(href) && href.includes('userConfigId')) {
          return <a {...props} />;
        }
        return <a {...props} target="_blank" rel="noopener noreferrer" />;
      },
      // Safety net for dead previews: a temp-file image URL 500s once its backing file is gone
      // (saved, cancelled, or expired by the 30-min sweep). The chat hook proactively strips the
      // preview it knows about, but this hides any broken image regardless of cause so the user
      // never sees a broken-image icon. COREDEV-321.
      img: ({ node, ...props }) => (
        <img
          {...props}
          onError={event => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ),
      code: ({ node, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';

        if (language === 'mermaid') {
          return <MermaidDiagram chart={String(children).replace(/\n$/, '')} className="ai-assistant-chat__mermaid-diagram" />;
        }

        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
    }),
    []
  );

  // Keyboard shortcut for opening chat
  const useAIAssistantShortcut = (callback, deps = []) => {
    const modifiers = IS_APPLE
      ? { meta: true, alt: false, shift: false, ctrl: false }
      : { meta: false, alt: true, shift: false, ctrl: false };
    useKeyboardShortcut('i', modifiers, callback, deps);
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

  const handleExportMarkdown = useCallback(() => {
    exportChat(currentChat.messages, 'markdown', currentChat.selectedAgent);
  }, [currentChat.messages, currentChat.selectedAgent]);

  const handleExportHtml = useCallback(() => {
    exportChat(currentChat.messages, 'html', currentChat.selectedAgent);
  }, [currentChat.messages, currentChat.selectedAgent]);

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

  // Scroll to bottom only when new messages are added (not on progress updates)
  useEffect(() => {
    const currentCount = currentChat.messages.length;
    if (currentCount > prevMessagesCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesCountRef.current = currentCount;
  }, [currentChat.messages]);

  // Email handlers
  const handleCopyEmail = useCallback(emailData => {
    if (emailData?.body) {
      navigator.clipboard.writeText(emailData.body).catch(err => {
        console.error('Failed to copy email:', err);
      });
    }
  }, []);

  // Text diff handler
  const handleApplyTextChanges = useCallback(async diffData => {
    if (!diffData?.recordRef || !diffData?.attribute) return;
    setIsApplyingTextChanges(true);

    try {
      const { recordRef, attribute, modifiedText: newText } = diffData;
      if (!newText) throw new Error(t('ai-assistant.notification.no-changes-data'));

      const contextData = editorContextService.getContextData();
      if (contextData.forceIntent === AI_INTENTS.TEXT_EDITING) {
        const updateHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.UPDATE_LEXICAL_CONTENT);
        if (contextData.recordRef === recordRef && contextData.attribute === attribute && updateHandler) {
          updateHandler(newText);
          NotificationManager.success(
            t('ai-assistant.notification.text-applied-editor'),
            t('ai-assistant.notification.text-editing-title')
          );
        } else {
          await applyChangesViaRecordsAPI(recordRef, attribute, newText);
        }
      } else {
        await applyChangesViaRecordsAPI(recordRef, attribute, newText);
      }
    } catch (error) {
      NotificationManager.error(
        error.message || t('ai-assistant.notification.text-apply-error'),
        t('ai-assistant.notification.error-title')
      );
    } finally {
      setIsApplyingTextChanges(false);
    }
  }, []);

  const applyChangesViaRecordsAPI = async (recordRef, attribute, newText) => {
    const recordId = recordRef.substring(recordRef.indexOf('@') + 1);
    if (!recordId) {
      NotificationManager.error(t('ai-assistant.notification.editor-not-found'), t('ai-assistant.notification.error-title'));
      return;
    }
    const recordToSave = Records.get(recordRef);
    recordToSave.att(attribute, newText);
    await recordToSave.save();
    recordToSave.events.emit(EVENTS.ATTS_UPDATED);
    NotificationManager.success(t('ai-assistant.notification.text-applied'), t('ai-assistant.notification.text-editing-title'));
  };

  // Script diff handler
  const handleApplyScriptChanges = useCallback(async scriptData => {
    if (!scriptData?.modifiedScript) {
      NotificationManager.error(t('ai-assistant.notification.no-changes-data'), t('ai-assistant.notification.error-title'));
      return;
    }
    setIsApplyingScriptChanges(true);

    try {
      const contextData = editorContextService.getContextData();
      if (contextData.forceIntent === AI_INTENTS.SCRIPT_WRITING) {
        const updateHandler = editorContextService.getHandler(EDITOR_CONTEXT_HANDLERS.UPDATE_SCRIPT_CONTENT);
        if (updateHandler) {
          updateHandler(scriptData.modifiedScript);
          NotificationManager.success(t('ai-assistant.notification.script-updated'), t('ai-assistant.notification.script-editing-title'));
        } else {
          NotificationManager.error(t('ai-assistant.notification.script-editor-not-found'), t('ai-assistant.notification.error-title'));
        }
      } else {
        NotificationManager.error(t('ai-assistant.notification.script-context-not-found'), t('ai-assistant.notification.error-title'));
      }
    } catch (error) {
      NotificationManager.error(
        error.message || t('ai-assistant.notification.script-apply-error'),
        t('ai-assistant.notification.error-title')
      );
    } finally {
      setIsApplyingScriptChanges(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e, isUniversal) => {
      const value = e.target.value;
      const setMessage = isUniversal ? universalChatHook.setMessage : contextualChatHook.setMessage;
      setMessage(value);

      if (isUniversal) {
        autocompleteHook.handleAutocompleteInputChange(value, e.target.selectionStart, e.target);
      }
    },
    [universalChatHook, contextualChatHook, autocompleteHook]
  );

  // Sending the message takes the `@` list down with it. Since D-B-23 the list no longer swallows
  // `Enter` when nothing is picked — the message is sent instead, which is the point — but nothing
  // was left to close the list: the input emptied, the query was gone, and the list went on hanging
  // over the answer, anchored to a field it no longer described. Both ways of sending go through
  // here, so the send button behaves like the key.
  const handleChatSubmit = useCallback(
    e => {
      autocompleteHook.hideAutocomplete();
      currentChat.handleSubmit(e);
    },
    [autocompleteHook, currentChat]
  );

  const handleKeyDown = useCallback(
    (e, isUniversal) => {
      if (autocompleteHook.showAutocomplete && isUniversal) {
        const filteredOptions = autocompleteHook.filteredAutocompleteOptions;
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

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit(e);
      }
    },
    [autocompleteHook, universalChatHook, handleChatSubmit]
  );

  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  // The `×` of a context chip, which is not always the same thing as toggling one collection.
  //
  // One record can be held twice over: picked by hand (or added by itself when its page was opened)
  // and attached by the backend as an auto-context artifact. `visibleAutoContextArtifacts` hides the
  // artifact so that a single chip is shown — which means removing that chip only takes the manual
  // half away, un-hides the artifact, and puts an identical chip straight back, with the record still
  // travelling in `contextArtifacts` of the next question. There was no way left to get it out of the
  // context at all. Removing therefore drops both halves.
  //
  // Only removing: adding must leave the artifact where it is, so that leaving the record's page
  // brings it back as a chip (the reason the sift is computed rather than written into the state).
  // Which of the two a toggle is about is decided before it runs, by whether the entry is in the
  // collection now.
  const handleToggleContext = useCallback(
    (contextType, item) => {
      if (isContextRemoval(contextType, item, additionalContext)) {
        universalChatHook.removeAutoContextArtifact(item.recordRef);
      }
      return toggleAdditionalContext(contextType, item);
    },
    [additionalContext, toggleAdditionalContext, universalChatHook]
  );

  // Clear conversation with script context reset (keep selected agent).
  // The chip is dropped only once the conversation is actually gone: a refused DELETE leaves it
  // alive server-side and already tells the user so, and removing the script context anyway would
  // both contradict that notification and unbind a script the chat keeps sending with every
  // following question (`editorContextService` is reset by the same successful path).
  // The outcome is passed on to the caller for the same reason: the agent selector clears the
  // conversation before switching agents and must not switch when the clearing was refused.
  // @returns {Promise<boolean>} True when the conversation was cleared
  const handleClearConversationKeepAgent = useCallback(async () => {
    const cleared = await universalChatHook.clearConversation();
    if (cleared) {
      removeScriptContext();
    }
    return cleared;
  }, [universalChatHook, removeScriptContext]);

  // The welcome screen's «Настроить платформу» shortcut is the second way to pick an agent, and it
  // has to pass the same gate as the selector in `ChatContextTags`: an agent switch rebinds the
  // conversation server-side (`AgentOrchestratorService.resolveAgentRef` stores the agent on it), so
  // a dialog that is still alive must be confirmed away and cleared first — both halves of that rule
  // live in `applyAgentSwitch`. That screen shows exactly when the message list is empty — which
  // since D-B-14 is also the state right after a reload, where the conversation id, its server-side
  // history and its agent binding all survive while only the on-screen list is gone. Handed the raw
  // setter, the shortcut switched the agent on that restored conversation with no confirmation and
  // no DELETE, and the next question continued the old dialog under a new agent.
  const handleSelectAgentFromWelcome = useCallback(
    async agent => {
      // The list is empty whenever this screen is on show, so a restored conversation is the only
      // thing an agent switch can lose here.
      const hasConversation = universalChatHook.hasRestoredConversation;
      try {
        await applyAgentSwitch({
          agent,
          hasConversation,
          // Nothing to clear on a chat that has never been used: no DELETE is sent, and the context
          // staged on the welcome screen (@-records, uploaded files) is left where the user put it.
          clearConversation: hasConversation ? handleClearConversationKeepAgent : null,
          selectAgent: universalChatHook.setSelectedAgent
        });
      } catch (error) {
        // Same reason as in the selector dropdown: the clearing is asynchronous and may throw, and
        // the caller here is a click handler that would drop the rejection on the floor.
        console.error('Error switching agent:', error);
        NotificationManager.error(t('ai-agent.switch-failed'), t('ai-agent.switch-error-title'));
      }
    },
    [universalChatHook, handleClearConversationKeepAgent]
  );

  // Helper functions
  const getContextTitle = () => {
    const context = editorContextService.getContext();
    switch (context) {
      case CONTEXT_TYPES.BPMN_EDITOR:
        return t('ai-assistant.context-title.bpmn-editor');
      default:
        return t('ai-assistant.context-title.none');
    }
  };

  const getContextHint = () => {
    const context = editorContextService.getContext();
    switch (context) {
      case CONTEXT_TYPES.BPMN_EDITOR:
        return t('ai-assistant.context-hint.bpmn-example');
      default:
        return t('ai-assistant.context-hint.unknown');
    }
  };

  if (!isOpen) return null;

  const currentRealTimeContext = editorContextService.getContext();
  const hasContext = !!currentRealTimeContext && currentRealTimeContext !== CONTEXT_TYPES.UNIVERSAL;

  // Render chat content
  const chatContent = (
    <>
      {/* Autocomplete dropdown */}
      {autocompleteHook.showAutocomplete &&
        (() => {
          const filteredOptions = autocompleteHook.filteredAutocompleteOptions;
          const showLoading = autocompleteHook.isSearchIndicatorVisible;
          // The same predicate decides whether the key handler may consume Escape/Enter, so the two
          // cannot disagree about a list that is open but draws nothing (useAutocomplete.js).
          if (!autocompleteHook.isAutocompleteListVisible(filteredOptions)) return null;
          const position = autocompleteHook.autocompletePosition;
          return (
            <div
              className="ai-assistant-chat__autocomplete"
              style={{
                position: 'fixed',
                left: position.left,
                // Which vertical bound is set is decided by the calculation in useAutocomplete:
                // bottom-anchored above the input field normally, top-anchored below it when there
                // is not enough room above (D-405-4).
                ...(position.top != null ? { top: position.top } : { bottom: position.bottom }),
                ...(position.maxHeight != null && { maxHeight: position.maxHeight }),
                zIndex: 105001
              }}
            >
              {showLoading && (
                <div className="ai-assistant-chat__autocomplete-item ai-assistant-chat__autocomplete-item--loading">
                  <Icon className="fa fa-spinner fa-spin ai-assistant-chat__autocomplete-icon" />
                  <div className="ai-assistant-chat__autocomplete-text">
                    <div className="ai-assistant-chat__autocomplete-label">{t('ai-assistant.autocomplete.searching')}</div>
                  </div>
                </div>
              )}
              {filteredOptions.map((option, index) => (
                <div
                  key={`${option.type}-${option.data?.recordRef || 'current'}`}
                  className={classNames('ai-assistant-chat__autocomplete-item', {
                    'ai-assistant-chat__autocomplete-item--disabled': option.disabled,
                    'ai-assistant-chat__autocomplete-item--selected': index === autocompleteHook.selectedAutocompleteIndex
                  })}
                  onClick={() =>
                    !option.disabled &&
                    autocompleteHook.insertContextMention(
                      option.type,
                      option.data,
                      universalChatHook.message,
                      universalChatHook.setMessage,
                      universalTextareaRef
                    )
                  }
                >
                  <Icon className={`fa ${option.icon} ai-assistant-chat__autocomplete-icon`} />
                  <div className="ai-assistant-chat__autocomplete-text">
                    <div className="ai-assistant-chat__autocomplete-label">{option.label}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

      <div
        className={classNames('ai-assistant-chat ai-assistant-chat--tabs', {
          minimized: isMinimized,
          'ai-assistant-chat--drag-over': dragOver
        })}
        // The drop hint is drawn by a CSS pseudo-element, which can only take its text from an
        // attribute — a literal in the stylesheet showed Russian wording in the English UI.
        data-drop-hint={t('ai-assistant.drop-files-hint')}
        ref={chatRef}
        onDrop={e => {
          e.preventDefault();
          if (activeTab === TAB_TYPES.UNIVERSAL) {
            handleFileUpload(e.dataTransfer.files);
          }
          fileUploadHook.handleDragLeave(e);
        }}
        onDragOver={e => {
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
          agentStatus={universalChatHook.agentStatus}
          selectedAgent={universalChatHook.selectedAgent}
          onExportMarkdown={handleExportMarkdown}
          onExportHtml={handleExportHtml}
          hasMessages={currentChat.messages.length > 0}
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
                onActionClick={currentChat.handleActionClick}
                onSelectDeployScope={currentChat.selectDeployScope}
                onSelectAgent={activeTab === TAB_TYPES.UNIVERSAL ? handleSelectAgentFromWelcome : undefined}
              />
            </div>

            <div className="ai-assistant-chat__input-section">
              <form className="ai-assistant-chat__input-container" onSubmit={handleChatSubmit}>
                {activeTab === TAB_TYPES.UNIVERSAL && (
                  <ChatContextTags
                    selectedAdditionalContext={selectedAdditionalContext}
                    additionalContext={additionalContext}
                    selectedTextContext={selectedTextContext}
                    workspaceContext={workspaceContext}
                    uploadedFiles={uploadedFiles}
                    uploadingFiles={uploadingFiles}
                    scriptContext={scriptContext}
                    autoContextArtifacts={universalChatHook.autoContextArtifacts}
                    selectedAgent={universalChatHook.selectedAgent}
                    onSelectAgent={universalChatHook.setSelectedAgent}
                    onClearConversation={handleClearConversationKeepAgent}
                    hasMessages={universalChatHook.messages.length > 0 || universalChatHook.hasRestoredConversation}
                    onToggleContext={handleToggleContext}
                    onRemoveSelectedText={removeSelectedTextContext}
                    onRemoveUploadedFile={removeUploadedFile}
                    onRemoveScriptContext={removeScriptContext}
                    onRemoveAutoContextArtifact={universalChatHook.removeAutoContextArtifact}
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
                  onClearConversation={handleClearConversationKeepAgent}
                  fileInputRef={fileInputRef}
                  onFileUpload={handleFileUpload}
                  selectedAgent={universalChatHook.selectedAgent}
                />
              </form>
            </div>
          </>
        )}
      </div>

      {showEmailModal && (
        <EmailModal
          emailFormData={emailFormData}
          isEmailSending={isEmailSending}
          onClose={handleEmailModalClose}
          onSend={handleEmailSend}
          onFieldChange={handleEmailFieldChange}
        />
      )}
    </>
  );

  // On mobile, render without resizable box
  if (isMobile) {
    return chatContent;
  }

  // On desktop/tablet, render with resizable box
  return (
    <div className="ai-assistant-resizable">
      <ResizableBox
        width={chatSize.width}
        height={isMinimized ? 50 : chatSize.height}
        minConstraints={[300, 300]}
        onResize={handleResize}
        resizeHandles={isMinimized ? NO_RESIZE_HANDLES : CORNER_RESIZE_HANDLE}
      >
        {chatContent}
      </ResizableBox>
    </div>
  );
};

export default AIAssistantChat;
