/**
 * AI Assistant constants
 */

import { t } from '@/helpers/export/util';

// Script context types mapping (key -> localization key suffix)
const SCRIPT_CONTEXT_TYPES = {
  bpmn_script_task: 'bpmn-script-task',
  gateway_condition: 'gateway-condition',
  computed_attribute: 'computed-attribute',
  computed_role: 'computed-role',
  ui_action: 'ui-action',
  journal_formatter: 'journal-formatter',
  dev_console: 'dev-console'
};

/**
 * Get localized label for script context type
 * @param {string} contextType - Context type key (e.g., 'computed_attribute')
 * @returns {string} Localized label
 */
export const getScriptContextLabel = (contextType) => {
  const localeKey = SCRIPT_CONTEXT_TYPES[contextType];
  if (localeKey) {
    return t(`script-context.${localeKey}`);
  }
  return contextType || t('script-context.default');
};

// Events
export const AI_ASSISTANT_EVENTS = {
  ADD_CONTEXT: 'aiAssistant:addContext',
  ADD_TEXT_REFERENCE: 'aiAssistant:addTextReference'
};

// Context types
export const ADDITIONAL_CONTEXT_TYPES = {
  CURRENT_RECORD: 'current_record',
  DOCUMENTS: 'documents',
  ATTRIBUTES: 'attributes',
  SELECTED_TEXT: 'selected_text',
  SCRIPT_CONTEXT: 'script_context'
};

// AI intents
export const AI_INTENTS = {
  TEXT_EDITING: 'text_editing',
  SCRIPT_WRITING: 'script_writing',
  BUSINESS_APP_GENERATION: 'business_app_generation'
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  TEXT_EDITING: 'text_editing',
  SCRIPT_WRITING: 'script_writing',
  BUSINESS_APP_GENERATION: 'business_app_generation'
};

// Content types for AI generation
export const CONTENT_TYPES = {
  TEXT: 'text',
  CODE: 'code',
  HTML: 'html'
};

// Tab types
export const TAB_TYPES = {
  UNIVERSAL: 'universal',
  CONTEXTUAL: 'contextual'
};

// Editor context handlers
export const EDITOR_CONTEXT_HANDLERS = {
  GET_CURRENT_TEXT: 'getCurrentText',
  UPDATE_CONTEXT_BEFORE_REQUEST: 'updateContextBeforeRequest',
  UPDATE_LEXICAL_CONTENT: 'updateLexicalContent',
  GET_CURRENT_SCRIPT: 'getCurrentScript',
  UPDATE_SCRIPT_CONTENT: 'updateScriptContent'
};

// Polling configuration
export const POLLING_INTERVAL = 1000;

// Chat dimensions
export const CHAT_DIMENSIONS = {
  DEFAULT_WIDTH: 350,
  DEFAULT_HEIGHT: 500,
  MIN_WIDTH: 300,
  MIN_HEIGHT: 300
};

// Autocomplete
export const AUTOCOMPLETE_QUERY_THRESHOLD = 2;

// API endpoints
export const API_ENDPOINTS = {
  UNIVERSAL_ASYNC: '/gateway/ai/api/assistant/universal/async',
  UNIVERSAL_STATUS: '/gateway/ai/api/assistant/universal',
  UNIVERSAL_CONVERSATION: '/gateway/ai/api/assistant/universal/conversation',
  BPMN_ASYNC: '/gateway/ai/api/assistant/bpmn/async',
  BPMN_STATUS: '/gateway/ai/api/assistant/bpmn',
  SEND_MAIL: '/gateway/ai/api/assistant/send-mail',
  FILE_UPLOAD: '/gateway/ai/api/assistant/upload-file'
};
