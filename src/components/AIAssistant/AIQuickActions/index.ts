/**
 * AI Quick Actions Module
 *
 * Universal AI quick actions system for form fields.
 * Provides context-aware AI assistance for different field types.
 *
 * Usage:
 * ```tsx
 * import { AIFieldActions, FIELD_TYPES } from '@/components/AIAssistant/AIQuickActions';
 *
 * <AIFieldActions
 *   fieldType={FIELD_TYPES.TEXT}
 *   getValue={() => inputRef.current?.value || ''}
 *   setValue={(value) => { if (inputRef.current) inputRef.current.value = value }}
 * >
 *   <input ref={inputRef} type="text" />
 * </AIFieldActions>
 * ```
 */

// Components
export {
  AIFieldActions,
  AIFieldTrigger,
  AIActionsBar,
  AIInlineResult,
  AIPopperWrapper,
  CodeDiffPreview,
  HtmlDiffPreview
} from './components';

// Component types
export type {
  AIFieldActionsProps,
  AIFieldTriggerProps,
  AIActionsBarProps,
  AIInlineResultProps,
  AIPopperWrapperProps,
  CodeDiffPreviewProps,
  HtmlDiffPreviewProps
} from './components';

// Hooks
export { useAIFieldActions } from './hooks';

// Hook types
export type {
  AIResult,
  GenerateRequestParams,
  GenerateResult,
  UseAIFieldActionsOptions,
  UseAIFieldActionsReturn
} from './hooks';

// Configuration
export {
  FIELD_TYPES,
  RESULT_MODES,
  TRIGGER_POSITIONS,
  ACTION_ICONS,
  FIELD_ACTION_CONFIGS,
  getFieldConfig,
  getAvailableActions,
  getContentType,
  isActionVisible
} from './config';

// Config types
export type {
  FieldType,
  ContentType,
  ResultMode,
  TriggerPosition,
  ActionIcon,
  QuickAction,
  FieldActionConfig,
  ActionVisibilityContext,
  ActionVisibilityPredicate
} from './config';

// Default export
export { AIFieldActions as default } from './components';
