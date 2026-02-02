/**
 * Field Action Configurations
 * Defines AI quick actions available for different field types
 */

import { t } from '@/helpers/export/util';
import FormContextService from '@/components/AIAssistant/FormContextService';
import { CONTENT_TYPES } from '@/components/AIAssistant/constants';

/**
 * Field types supported by the AI Quick Actions system
 */
export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  CODE: 'code',
  DOCUMENTATION: 'documentation',
  NAME: 'name',
  RICHTEXT: 'richtext'
} as const;

export type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES];

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

/**
 * Result display modes
 */
export const RESULT_MODES = {
  INLINE: 'inline',
  INLINE_DIFF: 'inline-diff'
} as const;

export type ResultMode = (typeof RESULT_MODES)[keyof typeof RESULT_MODES];

/**
 * Trigger position variants
 */
export const TRIGGER_POSITIONS = {
  INLINE: 'inline',
  FLOATING: 'floating'
} as const;

export type TriggerPosition = (typeof TRIGGER_POSITIONS)[keyof typeof TRIGGER_POSITIONS];

/**
 * Action icon definition
 */
export interface ActionIcon {
  fa: string;
  svg: string;
}

/**
 * Icon definitions for quick actions
 */
export const ACTION_ICONS: Record<string, ActionIcon> = {
  generate: {
    fa: 'fa-magic',
    svg: 'M12 2v4m0 12v4M2 12h4m12 0h4'
  },
  improve: {
    fa: 'fa-lightbulb-o',
    svg: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
  },
  translate: {
    fa: 'fa-globe',
    svg: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129'
  },
  expand: {
    fa: 'fa-expand',
    svg: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'
  },
  summarize: {
    fa: 'fa-compress',
    svg: 'M4 6h16M4 12h16M4 18h7'
  },
  fixGrammar: {
    fa: 'fa-pencil',
    svg: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
  },
  explain: {
    fa: 'fa-lightbulb-o',
    svg: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
  },
  fix: {
    fa: 'fa-wrench',
    svg: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0'
  },
  optimize: {
    fa: 'fa-bolt',
    svg: 'M13 10V3L4 14h7v7l9-11h-7z'
  },
  addComments: {
    fa: 'fa-comment-o',
    svg: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
  },
  document: {
    fa: 'fa-file-text-o',
    svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  generateComputedAttribute: {
    fa: 'fa-calculator',
    svg: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  }
};

/**
 * Visibility context for QuickAction filtering
 */
export interface ActionVisibilityContext {
  contextType: string;
  currentContent: string;
  fieldType: string;
}

/**
 * Visibility predicate function for complex conditions
 */
export type ActionVisibilityPredicate = (context: ActionVisibilityContext) => boolean;

/**
 * Quick action definition
 */
export interface QuickAction {
  id: string;
  icon: ActionIcon;
  getLabel: () => string;
  label?: string;
  requiresContent: boolean;
  /** Show action only for these context types (whitelist) */
  showForContextTypes?: string[];
  /** Hide action for these context types (blacklist) */
  hideForContextTypes?: string[];
  /** Custom visibility predicate for complex conditions */
  isVisible?: ActionVisibilityPredicate;
}

/**
 * Field action configuration
 */
export interface FieldActionConfig {
  triggerPosition: TriggerPosition;
  resultMode: ResultMode;
  contentType: ContentType;
  language?: string;
  quickActions: QuickAction[];
  getPlaceholder: () => string;
}

/**
 * Get localized label for an action
 */
const getActionLabel = (key: string, defaultLabel: string): (() => string) => {
  return () => t(`ai-actions.${key}`, defaultLabel);
};

/**
 * Field action configurations
 */
export const FIELD_ACTION_CONFIGS: Record<FieldType, FieldActionConfig> = {
  [FIELD_TYPES.TEXT]: {
    triggerPosition: TRIGGER_POSITIONS.INLINE,
    resultMode: RESULT_MODES.INLINE,
    contentType: CONTENT_TYPES.TEXT,
    quickActions: [
      {
        id: 'improve',
        icon: ACTION_ICONS.improve,
        getLabel: getActionLabel('improve', 'Improve'),
        requiresContent: true
      },
      {
        id: 'translate',
        icon: ACTION_ICONS.translate,
        getLabel: getActionLabel('translate', 'Translate'),
        requiresContent: true
      }
    ],
    getPlaceholder: () => t('ai-actions.placeholder.text', 'Describe what text you need...')
  },

  [FIELD_TYPES.NAME]: {
    triggerPosition: TRIGGER_POSITIONS.INLINE,
    resultMode: RESULT_MODES.INLINE,
    contentType: CONTENT_TYPES.TEXT,
    quickActions: [
      {
        id: 'improve',
        icon: ACTION_ICONS.improve,
        getLabel: getActionLabel('improve', 'Improve'),
        requiresContent: true
      }
    ],
    getPlaceholder: () => t('ai-actions.placeholder.name', 'Describe what name you need...')
  },

  [FIELD_TYPES.TEXTAREA]: {
    triggerPosition: TRIGGER_POSITIONS.FLOATING,
    resultMode: RESULT_MODES.INLINE_DIFF,
    contentType: CONTENT_TYPES.TEXT,
    quickActions: [
      {
        id: 'expand',
        icon: ACTION_ICONS.expand,
        getLabel: getActionLabel('expand', 'Expand'),
        requiresContent: true
      },
      {
        id: 'summarize',
        icon: ACTION_ICONS.summarize,
        getLabel: getActionLabel('summarize', 'Summarize'),
        requiresContent: true
      },
      {
        id: 'fix-grammar',
        icon: ACTION_ICONS.fixGrammar,
        getLabel: getActionLabel('fix-grammar', 'Fix grammar'),
        requiresContent: true
      }
    ],
    getPlaceholder: () => t('ai-actions.placeholder.textarea', 'Describe what to do with the text...')
  },

  [FIELD_TYPES.DOCUMENTATION]: {
    triggerPosition: TRIGGER_POSITIONS.FLOATING,
    resultMode: RESULT_MODES.INLINE_DIFF,
    contentType: CONTENT_TYPES.TEXT,
    quickActions: [
      {
        id: 'expand',
        icon: ACTION_ICONS.expand,
        getLabel: getActionLabel('expand', 'Expand'),
        requiresContent: true
      },
      {
        id: 'summarize',
        icon: ACTION_ICONS.summarize,
        getLabel: getActionLabel('summarize', 'Summarize'),
        requiresContent: true
      },
      {
        id: 'improve',
        icon: ACTION_ICONS.improve,
        getLabel: getActionLabel('improve', 'Improve'),
        requiresContent: true
      }
    ],
    getPlaceholder: () => t('ai-actions.placeholder.documentation', 'Describe what to do with documentation...')
  },

  [FIELD_TYPES.CODE]: {
    triggerPosition: TRIGGER_POSITIONS.FLOATING,
    resultMode: RESULT_MODES.INLINE_DIFF,
    contentType: CONTENT_TYPES.CODE,
    language: 'javascript',
    quickActions: [
      {
        id: 'generate-computed-attribute',
        icon: ACTION_ICONS.generateComputedAttribute,
        getLabel: getActionLabel('generate-computed-attribute', 'Generate Attribute Logic'),
        requiresContent: false,
        showForContextTypes: ['computed_attribute']
      },
      {
        id: 'explain',
        icon: ACTION_ICONS.explain,
        getLabel: getActionLabel('explain', 'Explain'),
        requiresContent: true
      },
      {
        id: 'fix',
        icon: ACTION_ICONS.fix,
        getLabel: getActionLabel('fix', 'Fix errors'),
        requiresContent: true
      },
      {
        id: 'optimize',
        icon: ACTION_ICONS.optimize,
        getLabel: getActionLabel('optimize', 'Optimize'),
        requiresContent: true
      }
    ],
    getPlaceholder: () => t('ai-actions.placeholder.code', 'Describe what to do with the script...')
  },

  [FIELD_TYPES.RICHTEXT]: {
    triggerPosition: TRIGGER_POSITIONS.FLOATING,
    resultMode: RESULT_MODES.INLINE_DIFF,
    contentType: CONTENT_TYPES.HTML,
    quickActions: [
      {
        id: 'improve',
        icon: ACTION_ICONS.improve,
        getLabel: getActionLabel('improve', 'Improve'),
        requiresContent: true
      },
      {
        id: 'expand',
        icon: ACTION_ICONS.expand,
        getLabel: getActionLabel('expand', 'Expand'),
        requiresContent: true
      },
      {
        id: 'summarize',
        icon: ACTION_ICONS.summarize,
        getLabel: getActionLabel('summarize', 'Summarize'),
        requiresContent: true
      },
      {
        id: 'fix-grammar',
        icon: ACTION_ICONS.fixGrammar,
        getLabel: getActionLabel('fix-grammar', 'Fix grammar'),
        requiresContent: true
      }
    ],
    getPlaceholder: () => t('ai-actions.placeholder.richtext', 'Describe what to do with the text...')
  }
};

/**
 * Get configuration for a specific field type
 */
export const getFieldConfig = (fieldType: string): FieldActionConfig => {
  return FIELD_ACTION_CONFIGS[fieldType as FieldType] || FIELD_ACTION_CONFIGS[FIELD_TYPES.TEXT];
};

/**
 * Check if action should be visible based on visibility conditions
 *
 * Priority order:
 * 1. Custom predicate (isVisible) - if defined, only this is used
 * 2. hideForContextTypes - if context in list, hide
 * 3. showForContextTypes - if defined, show only if context in list
 * 4. No conditions - show (backward compatible)
 */
export const isActionVisible = (
  action: QuickAction,
  contextType: string,
  currentContent: string,
  fieldType: string
): boolean => {
  // Custom predicate takes precedence
  if (typeof action.isVisible === 'function') {
    return action.isVisible({ contextType, currentContent, fieldType });
  }

  // Blacklist check
  if (action.hideForContextTypes && action.hideForContextTypes.length > 0) {
    if (action.hideForContextTypes.includes(contextType)) {
      return false;
    }
  }

  // Whitelist check
  if (action.showForContextTypes && action.showForContextTypes.length > 0) {
    return action.showForContextTypes.includes(contextType);
  }

  // No conditions = visible (backward compatible)
  return true;
};

/**
 * Get available quick actions based on field type, current content, and context type
 */
export const getAvailableActions = (
  fieldType: string,
  currentContent: string,
  contextType: string = ''
): QuickAction[] => {
  const config = getFieldConfig(fieldType);
  const hasContent = currentContent && currentContent.trim().length > 0;

  return config.quickActions.filter(action => {
    // Existing: content requirement check
    if (action.requiresContent && !hasContent) {
      return false;
    }

    // Visibility condition check
    return isActionVisible(action, contextType, currentContent, fieldType);
  });
};

/**
 * Get content type for a field type
 */
export const getContentType = (fieldType: string): ContentType => {
  const config = getFieldConfig(fieldType);
  return config.contentType || CONTENT_TYPES.TEXT;
};

/**
 * Context extraction configuration for script contexts
 * Defines how to extract parent form data for different script types
 * Configuration is stored in FormContextService (single source of truth)
 */
export interface ContextExtractionConfig {
  enabled: boolean;
  strategy?: 'all' | 'whitelist' | 'blacklist';
  fields?: string[];
  blacklistFields?: string[];
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
}

// Re-export from FormContextService for convenience
// Configuration is maintained in FormContextService to avoid duplication
export { default as FormContextService } from '@/components/AIAssistant/FormContextService';

/**
 * Get context extraction configuration for a script context type
 * Delegates to FormContextService for single source of truth
 */
export const getContextExtractionConfig = (contextType: string): ContextExtractionConfig => {
  return FormContextService.getExtractionConfig(contextType);
};

/**
 * Check if form context extraction is enabled for a context type
 */
export const isContextExtractionEnabled = (contextType: string): boolean => {
  const config = getContextExtractionConfig(contextType);
  return config.enabled;
};

export default FIELD_ACTION_CONFIGS;
