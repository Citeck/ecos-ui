import AIAssistantButton from './AIAssistantButton';
import AIAssistantChat from './AIAssistantChat';
import aiAssistantContext, { CONTEXT_TYPES } from './AIAssistantContext';
import aiAssistantService from './AIAssistantService';
import { setupDocumentQAContextObserver } from './DocumentQAInitializer';

setupDocumentQAContextObserver();

export {
  AIAssistantButton,
  AIAssistantChat,
  aiAssistantContext,
  CONTEXT_TYPES,
  aiAssistantService
};
