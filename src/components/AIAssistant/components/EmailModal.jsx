import React from 'react';
import { Icon } from '../../common';

/**
 * Email modal component for composing and sending emails
 * @param {Object} props
 * @param {Object} props.emailFormData - Email form data (to, subject, body, addToActivities)
 * @param {boolean} props.isEmailSending - Whether email is being sent
 * @param {Function} props.onClose - Modal close handler
 * @param {Function} props.onSend - Send email handler
 * @param {Function} props.onFieldChange - Field change handler (field, value)
 */
const EmailModal = ({
  emailFormData = { to: '', subject: '', body: '', addToActivities: true },
  isEmailSending = false,
  onClose,
  onSend,
  onFieldChange
}) => {
  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onFieldChange(field, value);
  };

  const isValid = emailFormData.to && emailFormData.subject && emailFormData.body;

  return (
    <div className="ai-assistant-email-modal-overlay">
      <div className="ai-assistant-email-modal">
        <div className="ai-assistant-email-modal__header">
          <h3>Отправить</h3>
          <button
            className="ai-assistant-email-modal__close"
            onClick={onClose}
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
              onChange={handleFieldChange('to')}
              placeholder="email@example.com"
            />
          </div>

          <div className="ai-assistant-email-modal__field">
            <label>Тема:</label>
            <input
              type="text"
              value={emailFormData.subject}
              onChange={handleFieldChange('subject')}
              placeholder="Тема письма"
            />
          </div>

          <div className="ai-assistant-email-modal__field">
            <label>Сообщение:</label>
            <textarea
              value={emailFormData.body}
              onChange={handleFieldChange('body')}
              rows="10"
              placeholder="Текст письма"
            />
          </div>

          <div className="ai-assistant-email-modal__field ai-assistant-email-modal__field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={emailFormData.addToActivities}
                onChange={handleFieldChange('addToActivities')}
              />
              <span>Добавить письмо в активности</span>
            </label>
          </div>
        </div>

        <div className="ai-assistant-email-modal__actions">
          <button
            className="ai-assistant-email-modal__button ai-assistant-email-modal__button--cancel"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            className="ai-assistant-email-modal__button ai-assistant-email-modal__button--send"
            onClick={onSend}
            disabled={!isValid || isEmailSending}
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
  );
};

export default EmailModal;
