/**
 * Shared types for AI Assistant services
 * Keep synchronized with backend DTOs in ru.citeck.ecos.ai.domain.assistant.common.editing
 */

/**
 * Attribute type for field metadata
 * Keep synchronized with backend AttributeType enum
 */
export const ATTRIBUTE_TYPES = {
  TEXT: 'TEXT',
  MLTEXT: 'MLTEXT',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  DATETIME: 'DATETIME',
  CONTENT: 'CONTENT',
  JSON: 'JSON',
  BINARY: 'BINARY',
  ASSOC: 'ASSOC',
  PERSON: 'PERSON',
  AUTHORITY: 'AUTHORITY',
  AUTHORITY_GROUP: 'AUTHORITY_GROUP',
  OPTIONS: 'OPTIONS'
} as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[keyof typeof ATTRIBUTE_TYPES];

/**
 * Script context type defines the execution context for AI-generated scripts.
 * Keep synchronized with backend ScriptContextType enum
 */
export const SCRIPT_CONTEXT_TYPES = {
  BPMN_SCRIPT_TASK: 'bpmn_script_task',
  GATEWAY_CONDITION: 'gateway_condition',
  COMPUTED_ATTRIBUTE: 'computed_attribute',
  COMPUTED_ROLE: 'computed_role',
  UI_ACTION: 'ui_action',
  JOURNAL_FORMATTER: 'journal_formatter',
  DEV_CONSOLE: 'dev_console'
} as const;

export type ScriptContextType = (typeof SCRIPT_CONTEXT_TYPES)[keyof typeof SCRIPT_CONTEXT_TYPES];

/**
 * Field type defines the UI component type being edited.
 * Keep synchronized with backend FieldType enum
 */
export const FIELD_TYPE_VALUES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  CODE: 'code',
  NAME: 'name',
  RICHTEXT: 'richtext'
} as const;

export type FieldTypeValue = (typeof FIELD_TYPE_VALUES)[keyof typeof FIELD_TYPE_VALUES];

/**
 * Field information for AI context
 * Contains metadata about the field being edited
 */
export interface FieldInfo {
  /** Attribute ID (e.g., "description", "tags", "comment") */
  id: string;
  /** Display name of the field (e.g., "Description", "Tags") */
  name: string;
  /** Data type of the attribute */
  type: AttributeType;
}

/**
 * Progress callback info
 */
export interface ProgressInfo {
  stage: string;
  progress: number;
  message: string;
}
