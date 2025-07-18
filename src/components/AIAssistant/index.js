import AIAssistantButton from './AIAssistantButton';
import AIAssistantChat from './AIAssistantChat';
import aiAssistantContext, { CONTEXT_TYPES } from './AIAssistantContext';
import aiAssistantService from './AIAssistantService';
import { setupBPMNContextObserver } from './BPMNInitializer';

setupBPMNContextObserver();

export {
  AIAssistantButton,
  AIAssistantChat,
  aiAssistantContext,
  CONTEXT_TYPES,
  aiAssistantService
};
