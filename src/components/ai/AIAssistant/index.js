import AIAssistantButton from './AIAssistantButton';
import AIAssistantChat from './AIAssistantChat';
import aiAssistantService from './AIAssistantService';
import AIContentService, { generateContent, QUICK_ACTIONS, CONTEXT_TYPES as CONTENT_CONTEXT_TYPES } from './AIContentService';
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
import { setupBPMNContextObserver } from './BPMNInitializer';
import editorContextService, { CONTEXT_TYPES } from './EditorContextService';
import ScriptAIService from './ScriptAIService';
import ScriptDiffViewer from './ScriptDiffViewer';
import ScriptEditorAIButton from './ScriptEditorAIButton';
import TextAIService, { TEXT_QUICK_ACTIONS, TEXT_CONTEXT_TYPES } from './TextAIService';
import TextAreaAIButton from './TextAreaAIButton';
import { CONTENT_TYPES } from './constants';

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
