import React from 'react';

const TAB_TYPES = {
  UNIVERSAL: 'universal',
  CONTEXTUAL: 'contextual'
};

/**
 * Welcome screen component shown when chat is empty
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab
 * @param {string} props.contextHint - Hint text for contextual tab
 */
const ChatWelcome = ({
  activeTab,
  contextHint = ''
}) => {
  return (
    <div className="ai-assistant-chat__empty">
      <div className="ai-assistant-chat__welcome">
        <h4>👋 Привет! Я - Citeck AI Assistant</h4>
        <p>Я помогу вам автоматизировать бизнес-процессы и работать с документами.</p>
      </div>

      {activeTab === TAB_TYPES.UNIVERSAL && (
        <div className="ai-assistant-chat__capabilities">
          <div className="ai-assistant-chat__capability">
            <strong>🏗️ Бизнес-приложения:</strong> генерация полноценных приложений из описания
          </div>
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
            • "Создай приложение для бронирования переговорных комнат"<br />
            • "Создай тип данных для заявки на отпуск"<br />
            • "Проанализируй документ @карточка"<br />
            • "Расскажи о клиенте @карточка"<br />
            • "Что ты умеешь делать?"
          </p>

          <p className="ai-assistant-chat__tip">
            💡 Используйте <code>@</code> для добавления записей и документов в контекст
          </p>
        </div>
      )}

      {activeTab === TAB_TYPES.CONTEXTUAL && contextHint && (
        <p className="ai-assistant-chat__hint">{contextHint}</p>
      )}
    </div>
  );
};

export default ChatWelcome;
