import React, {useState, useEffect, useRef} from 'react';
import classNames from 'classnames';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

import aiAssistantService from './AIAssistantService';
import aiAssistantContext, {CONTEXT_TYPES} from './AIAssistantContext';
import { Icon } from '../common';
import { TMP_ICON_EMPTY } from '../../constants';
import './style.scss';

const POLLING_INTERVAL = 2000;
const DEFAULT_WIDTH = 350;
const DEFAULT_HEIGHT = 500;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 300;

const AIAssistantChat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(aiAssistantService.isOpen);
    const [isMinimized, setIsMinimized] = useState(aiAssistantService.isMinimized);
    const [contextType, setContextType] = useState(aiAssistantContext.getContext());
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [pollingTimer, setPollingTimer] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [chatSize, setChatSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const chatRef = useRef(null);

    // Sync state with service
    useEffect(() => {
        const handleStateChange = (newIsOpen, newIsMinimized) => {
            setIsOpen(newIsOpen);
            setIsMinimized(newIsMinimized);
        };

        aiAssistantService.addListener(handleStateChange);

        const savedSize = localStorage.getItem('aiAssistantChatSize');
        if (savedSize) {
            try {
                const parsedSize = JSON.parse(savedSize);
                setChatSize(parsedSize);
            } catch (e) {
                console.error('Failed to parse saved chat size:', e);
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
                setMessages([]);
            }
        };

        // Check context every 1 second
        const intervalId = setInterval(checkContext, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [contextType]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Cleanup polling when component unmounts
    useEffect(() => {
        return () => {
            if (pollingTimer) {
                clearInterval(pollingTimer);
            }
        };
    }, [pollingTimer]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    const cancelActiveRequest = async () => {
        if (!activeRequestId) return;

        try {
            const response = await fetch(`/gateway/ecos-ai/api/assistant/bpmn/${activeRequestId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                console.error(`Error cancelling request: ${response.status}`);
                return;
            }

            // Stop polling
            if (pollingTimer) {
                clearInterval(pollingTimer);
                setPollingTimer(null);
            }

            // Update the processing message to show cancellation
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

            setActiveRequestId(null);
            setIsLoading(false);
            setIsPolling(false);

        } catch (error) {
            console.error('Error cancelling request:', error);
        }
    };

    const handleClose = () => {
        if (activeRequestId) {
            cancelActiveRequest();
        }

        // Stop polling if active
        if (pollingTimer) {
            clearInterval(pollingTimer);
            setPollingTimer(null);
        }

        setActiveRequestId(null);
        setIsLoading(false);
        setIsPolling(false);
        aiAssistantService.closeChat();
    };

    const handleMinimize = () => {
        const newState = aiAssistantService.toggleMinimize();
        setIsMinimized(newState);
    };

    const pollRequestStatus = async (requestId) => {
        if (isPolling) return;

        try {
            setIsPolling(true);

            const response = await fetch(`/gateway/ecos-ai/api/assistant/bpmn/${requestId}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.result) {
                clearInterval(pollingTimer);
                setPollingTimer(null);
                setActiveRequestId(null);
                setIsLoading(false);

                if (data.result && contextType === CONTEXT_TYPES.BPMN_EDITOR) {
                    aiAssistantService.handleSubmit(data.result);
                }

                setMessages(prevMessages =>
                    prevMessages.map((msg, index) => {
                        if (msg.isProcessing) {
                            return {
                                text: 'Процесс успешно создан и загружен в редактор.',
                                sender: 'ai',
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
                setIsLoading(false);

                setMessages(prevMessages =>
                    prevMessages.map(msg => {
                        if (msg.isProcessing) {
                            return {
                                ...msg,
                                text: `Ошибка: ${data.error || 'Произошла неизвестная ошибка'}`,
                                isProcessing: false,
                                isError: true
                            };
                        }
                        return msg;
                    })
                );

            } else if (data.status === 'cancelled') {
                clearInterval(pollingTimer);
                setPollingTimer(null);
                setActiveRequestId(null);
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
            }
            // If status is "processing", continue polling

        } catch (error) {
            console.error('Error polling request status:', error);

            clearInterval(pollingTimer);
            setPollingTimer(null);
            setActiveRequestId(null);
            setIsLoading(false);

            setMessages(prevMessages =>
                prevMessages.map(msg => {
                    if (msg.isProcessing) {
                        return {
                            ...msg,
                            text: 'Произошла ошибка при получении результата. Пожалуйста, попробуйте снова.',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMessage = {text: message, sender: 'user', timestamp: new Date()};
        setMessages(prevMessages => [...prevMessages, userMessage]);

        setMessage('');
        setIsLoading(true);

        try {
            // Depending on the context, we process the message
            if (contextType === CONTEXT_TYPES.BPMN_EDITOR) {
                const contextHandler = aiAssistantContext.getHandler('updateContextBeforeRequest');
                if (typeof contextHandler === 'function') {
                    await new Promise(resolve => contextHandler(resolve));
                }

                const contextData = aiAssistantContext.getContextData();
                const {processRef, ecosType, currentBpmnXml} = contextData;

                const requestData = {
                    userInput: message,
                    processRef: processRef || '',
                    ecosType: ecosType || '',
                    currentBpmnXml: currentBpmnXml || ''
                };

                const response = await fetch('/gateway/ecos-ai/api/assistant/bpmn', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
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

                setActiveRequestId(requestId);

                // Start polling for the result
                const timer = setInterval(() => pollRequestStatus(requestId), POLLING_INTERVAL);
                setPollingTimer(timer);

                // Add a message indicating that the request is being processed
                const processingMessage = {
                    text: 'Запрос обрабатывается. Это может занять некоторое время...',
                    sender: 'ai',
                    timestamp: new Date(),
                    isProcessing: true,
                    pollingIsUsed: true
                };

                setMessages(prevMessages => [...prevMessages, processingMessage]);
            } else if (contextType === CONTEXT_TYPES.DOCUMENT_QA) {
                const contextData = aiAssistantContext.getContextData();
                const { recordRef } = contextData;

                if (!recordRef) {
                    throw new Error('Не указан идентификатор документа');
                }

                const requestData = {
                    question: message,
                    recordRef: recordRef
                };

                const processingMessage = {
                    text: 'Анализирую документ, это может занять некоторое время...',
                    sender: 'ai',
                    timestamp: new Date(),
                    isProcessing: true,
                    pollingIsUsed: false // Флаг, что НЕ используется polling
                };

                setMessages(prevMessages => [...prevMessages, processingMessage]);

                const response = await fetch('/gateway/ecos-ai/api/assistant/document-qa', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();

                // Update the processing message with the actual response
                setMessages(prevMessages =>
                    prevMessages.map(msg => {
                        if (msg.isProcessing) {
                            return {
                                text: data.result || 'Не удалось получить ответ на ваш вопрос.',
                                sender: 'ai',
                                timestamp: new Date(),
                                isProcessing: false
                            };
                        }
                        return msg;
                    })
                );

                setIsLoading(false);
            } else {
                setTimeout(() => {
                    const aiMessage = {
                        text: 'Извините, этот контекст пока не поддерживается.',
                        sender: 'ai',
                        timestamp: new Date()
                    };

                    setMessages(prevMessages => [...prevMessages, aiMessage]);
                    setIsLoading(false);
                }, 1000);
            }
        } catch (error) {
            console.error('Error fetching AI response:', error);

            const errorMessage = {
                text: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова.',
                sender: 'ai',
                timestamp: new Date(),
                isError: true
            };

            setMessages(prevMessages =>
                prevMessages.map(msg => {
                    if (msg.isProcessing) {
                        return errorMessage;
                    }
                    return msg;
                }).concat(
                    !prevMessages.some(msg => msg.isProcessing) ? [errorMessage] : []
                )
            );

            setIsLoading(false);

            if (pollingTimer) {
                clearInterval(pollingTimer);
                setPollingTimer(null);
            }

            setActiveRequestId(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const getContextTitle = () => {
        switch (contextType) {
            case CONTEXT_TYPES.BPMN_EDITOR:
                return 'Citeck AI - BPMN Редактор';
            case CONTEXT_TYPES.DOCUMENT_QA:
                return 'Citeck AI - Анализ документа';
            default:
                return 'Citeck AI';
        }
    };

    const getContextHint = () => {
        switch (contextType) {
            case CONTEXT_TYPES.BPMN_EDITOR:
                return 'Например: "Создай процесс обработки заявки на отпуск, который включает этапы согласования с руководителем и отделом кадров"';
            case CONTEXT_TYPES.DOCUMENT_QA:
                return 'Например: "Какие ключевые пункты содержит этот документ?" или "Расскажи о главных требованиях в этом документе"';
            default:
                return 'Опишите, что вы хотите сделать...';
        }
    };

    const handleResize = (event, { size }) => {
        const { width, height } = size;
        setChatSize({ width, height });

        localStorage.setItem('aiAssistantChatSize', JSON.stringify({ width, height }));
    };

    if (!isOpen) return null;

    return (
        <div className="ai-assistant-resizable">
            <ResizableBox
                width={chatSize.width}
                height={isMinimized ? 50 : chatSize.height}
                minConstraints={[MIN_WIDTH, MIN_HEIGHT]}
                onResize={handleResize}
                resizeHandles={['nw']}
                disableResize={isMinimized}
            >
                <div className={classNames("ai-assistant-chat", { "minimized": isMinimized })} ref={chatRef}>
                    <div className="ai-assistant-chat__header">
                        <h3 className="ai-assistant-chat__title">{getContextTitle()}</h3>
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

                    <div className="ai-assistant-chat__messages">
                        {messages.length === 0 ? (
                            <div className="ai-assistant-chat__empty">
                                <p>Опишите, что вы хотите сделать, и AI поможет вам.</p>
                                <p className="ai-assistant-chat__hint">{getContextHint()}</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={classNames(
                                        'ai-assistant-chat__message',
                                        `ai-assistant-chat__message--${msg.sender}`,
                                        {
                                            'ai-assistant-chat__message--error': msg.isError,
                                            'ai-assistant-chat__message--processing': msg.isProcessing,
                                            'ai-assistant-chat__message--cancelled': msg.isCancelled
                                        }
                                    )}
                                >
                                    <div className="ai-assistant-chat__message-content">
                                        {msg.text}
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
                                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}
                                    </div>
                                    <div ref={messagesEndRef}/>
                                </div>
                            ))
                        )}

                        {isLoading && !activeRequestId && (
                            <div
                                className="ai-assistant-chat__message ai-assistant-chat__message--ai ai-assistant-chat__message--loading">
                                <div className="ai-assistant-chat__loading-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form className="ai-assistant-chat__form" onSubmit={handleSubmit}>
                        <textarea
                            ref={textareaRef}
                            className="ai-assistant-chat__input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            rows={1}
                        />
                        <button
                            type="submit"
                            className="ai-assistant-chat__submit"
                            disabled={isLoading || !message.trim()}
                        >
                            Отправить
                        </button>
                    </form>
                </div>
            </ResizableBox>
        </div>
    );
};

export default AIAssistantChat;
