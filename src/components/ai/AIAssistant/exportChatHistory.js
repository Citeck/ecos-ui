import { marked } from 'marked';
import { t } from '@/helpers/export/util';
import { formatMessageTime } from './utils';

/**
 * Format date in Russian locale: DD.MM.YYYY HH:MM
 * @param {Date} date
 * @returns {string}
 */
const formatExportDate = (date) => {
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format sender role for export header
 * @param {Object} message
 * @param {Object|null} selectedAgent
 * @returns {string}
 */
const formatSenderRole = (message, selectedAgent) => {
  if (message.sender === 'user') {
    return t('ai-assistant.export.role-user');
  }
  if (selectedAgent) {
    return selectedAgent.name;
  }
  return t('ai-assistant.export.role-ai');
};

/**
 * Build markdown content for a single message
 * @param {Object} message
 * @returns {string|null} null if message should be skipped
 */
const buildMessageMarkdown = (message) => {
  if (message.isProcessing || message.isCancelled) {
    return null;
  }

  if (message.isError) {
    return `> ⚠ ${t('ai-assistant.export.error')}: ${message.text}`;
  }

  if (message.isEmailContent && message.messageData) {
    const { subject, to, body } = message.messageData;
    const parts = [];
    if (subject) {
      parts.push(`**${t('ai-assistant.export.email-subject')}:** ${subject}`);
    }
    if (to) {
      parts.push(`**${t('ai-assistant.export.email-to')}:** ${to}`);
    }
    if (body) {
      parts.push('', body);
    }
    return parts.join('\n');
  }

  if (message.isTextDiffContent && message.messageData) {
    const { originalPlainText, modifiedPlainText, attributeName } = message.messageData;
    const parts = [message.text];
    if (attributeName) {
      parts.push('', `**${attributeName}**`);
    }
    if (originalPlainText) {
      parts.push('', `**${t('ai-assistant.export.original')}:**`, '', originalPlainText);
    }
    if (modifiedPlainText) {
      parts.push('', `**${t('ai-assistant.export.modified')}:**`, '', modifiedPlainText);
    }
    return parts.join('\n');
  }

  if (message.isScriptDiffContent && message.messageData) {
    const { originalScript, modifiedScript, contextType } = message.messageData;
    const parts = [message.text];
    if (contextType) {
      parts.push('', `**${t('ai-assistant.export.context-type')}:** ${contextType}`);
    }
    if (originalScript) {
      parts.push('', `**${t('ai-assistant.export.original')}:**`, '', '```js', originalScript, '```');
    }
    if (modifiedScript) {
      parts.push('', `**${t('ai-assistant.export.modified')}:**`, '', '```js', modifiedScript, '```');
    }
    return parts.join('\n');
  }

  if (message.isAgentPlanContent && message.messageData) {
    const parts = [];
    if (message.text) {
      parts.push(message.text);
    }
    if (message.messageData.error) {
      parts.push('', `> ⚠ ${t('ai-assistant.export.error')}: ${message.messageData.error}`);
    }
    if (message.messageData.artifacts && message.messageData.artifacts.length > 0) {
      parts.push('', `**${t('ai-assistant.export.artifacts')}:**`);
      message.messageData.artifacts.forEach((artifact) => {
        parts.push(`- ${artifact.name || artifact.id || artifact}`);
      });
    }
    return parts.join('\n');
  }

  if (message.isAgentProgressContent && message.messageData) {
    const { type, steps, completedSteps, totalSteps } = message.messageData;

    if (type === 'agent_planning') {
      return message.text || t('ai-assistant.export.planning');
    }

    if (type === 'agent_execution' && steps && steps.length > 0) {
      const parts = [];
      if (completedSteps != null && totalSteps != null) {
        parts.push(`**${t('ai-assistant.export.progress')}:** ${completedSteps}/${totalSteps}`);
        parts.push('');
      }
      steps.forEach((step) => {
        const checkbox = step.status === 'COMPLETED' ? '[x]' : '[ ]';
        let line = `- ${checkbox} ${step.description}`;
        if (step.executionTime && step.status === 'COMPLETED') {
          line += ` (${step.executionTime})`;
        }
        if (step.status === 'FAILED' && step.error) {
          line += ` — ${t('ai-assistant.export.error')}: ${step.error}`;
        }
        parts.push(line);
      });
      return parts.join('\n');
    }

    return message.text || '';
  }

  if (message.isBusinessAppContent && message.messageData) {
    const { detailedStatus, message: statusMessage, artifacts } = message.messageData;
    const parts = [detailedStatus || statusMessage || message.text];
    if (artifacts && artifacts.length > 0) {
      parts.push('', `**${t('ai-assistant.export.artifacts')}:**`);
      artifacts.forEach((artifact) => {
        parts.push(`- ${artifact.name || artifact.id || artifact}`);
      });
    }
    return parts.join('\n');
  }

  return message.text || '';
};

/**
 * Build full Markdown document from messages
 * @param {Array} messages
 * @param {Object|null} selectedAgent
 * @returns {string}
 */
export const buildChatMarkdown = (messages, selectedAgent = null) => {
  const lines = [
    `# Citeck AI — ${t('ai-assistant.export.title')}`,
    formatExportDate(new Date()),
    ''
  ];

  messages.forEach((message) => {
    const content = buildMessageMarkdown(message);
    if (content === null) {
      return;
    }

    const role = formatSenderRole(message, selectedAgent);
    const time = formatMessageTime(message.timestamp);

    lines.push('---', '');
    lines.push(`### ${role} (${time})`);
    lines.push('');
    lines.push(content);
    lines.push('');
  });

  return lines.join('\n');
};

/**
 * Build styled HTML document from messages
 * @param {Array} messages
 * @param {Object|null} selectedAgent
 * @returns {string}
 */
export const buildChatHtml = (messages, selectedAgent = null) => {
  const markdown = buildChatMarkdown(messages, selectedAgent);
  const htmlBody = marked.parse(markdown, { gfm: true, breaks: true });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Citeck AI — ${t('ai-assistant.export.title')}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      color: #333;
      line-height: 1.6;
    }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h3 { font-size: 16px; margin-bottom: 8px; color: #555; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
    pre {
      background: #f5f5f5;
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      font-size: 13px;
    }
    code { font-family: 'SF Mono', Consolas, monospace; font-size: 13px; }
    blockquote {
      border-left: 3px solid #e0e0e0;
      margin: 8px 0;
      padding: 4px 12px;
      color: #666;
    }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    ul { padding-left: 20px; }
    li { margin: 4px 0; }
    @media print {
      body { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;
};

/**
 * Download content as file
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate export filename with timestamp
 * @param {string} extension
 * @returns {string}
 */
const generateFilename = (extension) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `chat-export-${date}-${time}.${extension}`;
};

/**
 * Export chat messages to file
 * @param {Array} messages
 * @param {'markdown'|'html'} format
 * @param {Object|null} selectedAgent
 */
export const exportChat = (messages, format, selectedAgent = null) => {
  if (format === 'markdown') {
    const content = buildChatMarkdown(messages, selectedAgent);
    downloadFile(content, generateFilename('md'), 'text/markdown');
  } else if (format === 'html') {
    const content = buildChatHtml(messages, selectedAgent);
    downloadFile(content, generateFilename('html'), 'text/html');
  }
};
