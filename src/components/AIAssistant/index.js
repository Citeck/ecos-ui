import AIAssistantButton from './AIAssistantButton';
import AIAssistantChat from './AIAssistantChat';
import ScriptEditorAIButton from './ScriptEditorAIButton';
import ScriptDiffViewer from './ScriptDiffViewer';
import ScriptAIService from './ScriptAIService';
import TextAreaAIButton from './TextAreaAIButton';
import TextAIService, { TEXT_QUICK_ACTIONS, TEXT_CONTEXT_TYPES } from './TextAIService';
import editorContextService, { CONTEXT_TYPES } from './EditorContextService';
import aiAssistantService from './AIAssistantService';
import { setupBPMNContextObserver } from './BPMNInitializer';

// Unified AI Content Service
import AIContentService, {
  generateContent,
  QUICK_ACTIONS,
  CONTEXT_TYPES as CONTENT_CONTEXT_TYPES
} from './AIContentService';
import { CONTENT_TYPES } from './constants';

// Universal AI Quick Actions
import {
  AIFieldActions,
  AIFieldTrigger,
  AIActionsBar,
  AIInlineResult,
  CodeDiffPreview,
  HtmlDiffPreview,
  useAIFieldActions,
  FIELD_TYPES,
  RESULT_MODES,
  TRIGGER_POSITIONS,
  getFieldConfig,
  getAvailableActions,
  getContentType
} from './AIQuickActions';

if (typeof jest === 'undefined') {
  setupBPMNContextObserver();
}

export {
  // Core components
  AIAssistantButton,
  AIAssistantChat,
  ScriptEditorAIButton,
  ScriptDiffViewer,
  ScriptAIService,
  editorContextService,
  CONTEXT_TYPES,
  aiAssistantService,

  // TextArea AI components
  TextAreaAIButton,
  TextAIService,
  TEXT_QUICK_ACTIONS,
  TEXT_CONTEXT_TYPES,

  // Unified AI Content Service
  AIContentService,
  generateContent,
  CONTENT_TYPES,
  QUICK_ACTIONS,
  CONTENT_CONTEXT_TYPES,

  // Universal AI Quick Actions
  AIFieldActions,
  AIFieldTrigger,
  AIActionsBar,
  AIInlineResult,
  CodeDiffPreview,
  HtmlDiffPreview,
  useAIFieldActions,
  FIELD_TYPES,
  RESULT_MODES,
  TRIGGER_POSITIONS,
  getFieldConfig,
  getAvailableActions,
  getContentType
};
