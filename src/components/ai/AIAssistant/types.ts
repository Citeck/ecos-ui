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

/**
 * Agent status values for agent orchestrator mode
 * Keep synchronized with backend AgentState.AgentStatus enum
 */
export const AGENT_STATUSES = {
  PLANNING: 'PLANNING',
  WAITING_PLAN_APPROVAL: 'WAITING_PLAN_APPROVAL',
  EXECUTING: 'EXECUTING',
  WAITING_STEP_APPROVAL: 'WAITING_STEP_APPROVAL',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;

export type AgentStatus = (typeof AGENT_STATUSES)[keyof typeof AGENT_STATUSES];

/**
 * Step status within agent execution
 */
export type AgentStepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

/**
 * Progress info for individual agent step
 */
export interface AgentStepProgress {
  id: string;
  description: string;
  status: AgentStepStatus;
  error?: string;
}

/**
 * Workspace context loaded automatically when chat opens
 */
export interface WorkspaceContext {
  workspaceId: string;
  workspaceName: string;
}


/**
 * Progress info for agent orchestrator mode
 * Keep synchronized with backend agent progress format
 */
export interface AgentProgressInfo {
  type: 'agent_planning' | 'agent_execution';
  currentStepId?: string;
  currentStepDescription?: string;
  completedSteps?: number;
  totalSteps?: number;
  overallProgress?: number;
  steps?: AgentStepProgress[];
}

/**
 * Status of one config-agent tool invocation (mirror backend AgentToolStepStatus).
 */
export type ToolStepStatus = 'RUNNING' | 'DONE' | 'ERROR';

/**
 * One config-agent tool invocation in the cumulative tool-loop feed (contract #2).
 * `stepIndex` is the stable, monotonic key the frontend merges/upserts on.
 */
export interface ToolStep {
  tool: string;
  label: string;
  status: ToolStepStatus;
  stepIndex: number;
  detail?: string;
}

/**
 * Progress info for the config-agent tool-loop (COREDEV-323 contract #2).
 * Emitted with `type === 'agent_tool_step'`. The top-level `tool`/`label`/`status`/
 * `stepIndex` describe the step that triggered this emission; `toolSteps` carries the
 * full self-contained cumulative feed, which the frontend merges by `stepIndex` so no
 * sub-second step is lost between polls.
 */
export interface ToolStepProgressInfo {
  type: 'agent_tool_step';
  tool?: string;
  label?: string;
  status?: ToolStepStatus;
  detail?: string;
  stepIndex?: number;
  totalHint?: number;
  toolSteps?: ToolStep[];
}

/**
 * Deploy scope kind for the config-agent HITL deploy gate (mirror backend DeployScopeKind).
 */
export type DeployScopeKind = 'GLOBAL' | 'WORKSPACE';

/**
 * One deploy target scope (mirror backend DeployScopeInfo). `label` is localized by the
 * backend and rendered as-is; `workspaceId` is present only for WORKSPACE scopes.
 */
export interface DeployScopeInfo {
  kind: DeployScopeKind;
  workspaceId?: string;
  label: string;
}

/**
 * Pending platform-artifact deploy awaiting confirmation (COREDEV-323 contract #3,
 * mirror backend PendingDeployInfo). `targetScope` is the default; when `changeable`
 * is true the user may pick another scope from `options` and it is sent back as
 * `ChatRequest.deployScope` alongside the `deploy_confirm` action.
 */
export interface PendingDeployInfo {
  artifactType: string;
  targetScope: DeployScopeInfo;
  changeable: boolean;
  options?: DeployScopeInfo[];
}
