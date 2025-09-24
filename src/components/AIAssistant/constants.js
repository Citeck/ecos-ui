/**
 * AI Assistant constants
 */

export const AI_ASSISTANT_EVENTS = {
  ADD_CONTEXT: 'aiAssistant:addContext',
  ADD_TEXT_REFERENCE: 'aiAssistant:addTextReference'
};

export const ADDITIONAL_CONTEXT_TYPES = {
  CURRENT_RECORD: 'current_record',
  DOCUMENTS: 'documents',
  ATTRIBUTES: 'attributes',
  SELECTED_TEXT: 'selected_text'
};

export const AI_INTENTS = {
  TEXT_EDITING: 'text_editing',
  BUSINESS_APP_GENERATION: 'business_app_generation'
}

export const MESSAGE_TYPES = {
  TEXT: "text",
  EMAIL: "email",
  TEXT_EDITING: "text_editing",
  BUSINESS_APP_GENERATION: "business_app_generation"
}
