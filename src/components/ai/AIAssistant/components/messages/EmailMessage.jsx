import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { t } from '@/helpers/export/util';
import { Icon } from '@/components/common';

/**
 * Email message preview component
 * @param {Object} props
 * @param {Object} props.messageData - Email data (subject, body, to)
 * @param {Object} props.markdownComponents - Markdown component overrides
 * @param {Function} props.onCopy - Copy email handler
 * @param {Function} props.onSend - Send email handler
 */
const EmailMessage = ({
  messageData,
  markdownComponents,
  onCopy,
  onSend
}) => {
  if (!messageData) return null;

  return (
    <>
      <div className="ai-assistant-chat__email-preview">
        <div className="ai-assistant-chat__email-subject">
          <strong>{t('ai-assistant.email-message.subject')}</strong> {messageData.subject}
        </div>
        <div className="ai-assistant-chat__email-body">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {messageData.body?.replace(/\n/g, '  \n')}
          </Markdown>
        </div>
        {messageData.to && (
          <div className="ai-assistant-chat__email-recipient">
            <strong>{t('ai-assistant.email-message.recipient')}</strong> {messageData.to}
          </div>
        )}
      </div>
      <div className="ai-assistant-chat__email-actions">
        <button
          className="ai-assistant-chat__action-button ai-assistant-chat__action-button--copy"
          onClick={onCopy}
        >
          <Icon className="fa fa-copy" /> {t('ai-assistant.email-message.copy')}
        </button>
        <button
          className="ai-assistant-chat__action-button ai-assistant-chat__action-button--send"
          onClick={onSend}
        >
          <Icon className="fa fa-send" /> {t('ai-assistant.email-message.send')}
        </button>
      </div>
    </>
  );
};

export default EmailMessage;
