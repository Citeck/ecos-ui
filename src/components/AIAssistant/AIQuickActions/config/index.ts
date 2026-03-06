/**
 * AI Quick Actions Configuration
 */

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
} from './fieldActionConfigs';

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
} from './fieldActionConfigs';
