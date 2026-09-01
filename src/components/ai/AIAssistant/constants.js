/**
 * AI Assistant constants
 */

import { t } from '@/helpers/export/util';

// Script context types mapping (key -> localization key suffix)
const SCRIPT_CONTEXT_TYPES = {
  bpmn_script_task: 'bpmn-script-task',
  gateway_condition: 'gateway-condition',
  computed_attribute: 'computed-attribute',
  computed_role: 'computed-role',
  ui_action: 'ui-action',
  journal_formatter: 'journal-formatter',
  dev_console: 'dev-console'
};

// Text context types (see TEXT_CONTEXT_TYPES in TextAIService.ts). The localization key suffix
// matches the type itself, so a plain list is enough — unlike the script types above, which turn
// an underscore into a hyphen.
//
// The list is duplicated rather than imported because `TextAIService.ts` imports this module, so
// the import back would close a cycle (`yarn check:cycles`). Drift between the two copies is not
// harmless — an unknown type falls through to the *script* fallback and labels a text field
// "Скрипт" — so `getScriptContextLabel.test.js` asserts the two lists match and fails on drift.
// Exported for that test.
//
// Deliberately NOT named `TEXT_CONTEXT_TYPES`: `TextAIService.ts` exports a constant under that
// name from the same module tree (and `AIAssistant/index.js` re-exports it), but as a *table*
// (`{ GENERAL: 'general', … }`). Two same-named exports of incompatible shape next to each other are
// a trap that fails silently — `TEXT_CONTEXT_TYPES.GENERAL` resolved against the list is
// `undefined`, and `TextArea.jsx` uses exactly that expression as the fallback context type, so a
// misresolved import would quietly turn AI off for a textarea instead of raising anything.
export const TEXT_CONTEXT_TYPE_LIST = ['documentation', 'description', 'name', 'comment', 'general'];

/**
 * Get localized label for a script or text context type
 * @param {string} contextType - Context type key (e.g., 'computed_attribute', 'general')
 * @returns {string} Localized label
 */
export const getScriptContextLabel = contextType => {
  // Own keys only: a plain object literal answers `toString`/`constructor`/`valueOf` from
  // `Object.prototype` with a truthy function, which the template below would interpolate into the
  // header as `script-context.function toString() { [native code] }` — the raw-identifier defect
  // this fallback exists to prevent, in its ugliest form.
  const localeKey = Object.prototype.hasOwnProperty.call(SCRIPT_CONTEXT_TYPES, contextType) ? SCRIPT_CONTEXT_TYPES[contextType] : null;
  if (localeKey) {
    return t(`script-context.${localeKey}`);
  }
  if (TEXT_CONTEXT_TYPE_LIST.includes(contextType)) {
    return t(`text-context.${contextType}`);
  }
  // An unknown type is never shown as is: a raw identifier in the header reads as a defect.
  return t('script-context.default');
};

// Events
export const AI_ASSISTANT_EVENTS = {
  ADD_CONTEXT: 'aiAssistant:addContext',
  ADD_TEXT_REFERENCE: 'aiAssistant:addTextReference'
};

// Context types
export const ADDITIONAL_CONTEXT_TYPES = {
  CURRENT_RECORD: 'current_record',
  DOCUMENTS: 'documents',
  ATTRIBUTES: 'attributes',
  SELECTED_TEXT: 'selected_text',
  SCRIPT_CONTEXT: 'script_context'
};

// AI intents
export const AI_INTENTS = {
  TEXT_EDITING: 'text_editing',
  SCRIPT_WRITING: 'script_writing',
  BUSINESS_APP_GENERATION: 'business_app_generation'
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  TEXT_EDITING: 'text_editing',
  SCRIPT_WRITING: 'script_writing',
  BUSINESS_APP_GENERATION: 'business_app_generation',
  AGENT_PLANNING: 'agent_planning',
  AGENT_EXECUTION: 'agent_execution'
};

/**
 * Progress `type` for the config-agent tool-loop feed (COREDEV-323 contract #2).
 * Distinct from `agent_execution` (a fixed, pre-known plan): config-agent steps are
 * not known in advance, so the feed is cumulative and merged by `stepIndex`.
 */
export const AGENT_TOOL_STEP_PROGRESS_TYPE = 'agent_tool_step';

/** Tool-step statuses emitted by the config agent (mirror backend AgentToolStepStatus). */
export const TOOL_STEP_STATUS = {
  RUNNING: 'RUNNING',
  DONE: 'DONE',
  ERROR: 'ERROR'
};

/** Icon/style mapping per tool-step status for the tool-loop ribbon. */
export const TOOL_STEP_STATUS_ICONS = {
  [TOOL_STEP_STATUS.RUNNING]: { icon: 'fa-spinner', className: 'tool-step--running', spin: true },
  [TOOL_STEP_STATUS.DONE]: { icon: 'fa-check-circle', className: 'tool-step--done' },
  [TOOL_STEP_STATUS.ERROR]: { icon: 'fa-times-circle', className: 'tool-step--error' }
};

export const getToolStepStatusConfig = status => TOOL_STEP_STATUS_ICONS[status] || TOOL_STEP_STATUS_ICONS[TOOL_STEP_STATUS.RUNNING];

// File-save action ids (mirror citeck-ai FileSaveOrchestrator). Action ids attached to a
// pending file proposal have the form `<base>|<tempRef>` — the separator lets the backend
// scope a save/cancel to one specific temp file when several previews are pending at once.
export const FILE_SAVE_ACTION = {
  TEMP_REF_SEPARATOR: '|',
  MAIN_CONTENT: 'main_content',
  NEW_RECORD: 'new_record',
  CANCEL: 'file_cancel',
  ATTR_PREFIX: 'attr:'
};

/**
 * Stable action ids for the config-agent HITL deploy gate (COREDEV-323 contract #3,
 * mirror backend AgentOrchestratorService.DEPLOY_CONFIRM_ACTION/DEPLOY_REJECT_ACTION).
 * Button labels arrive localized from the backend; only `deploy_confirm` carries a
 * `deployScope` override in the action payload.
 */
export const DEPLOY_ACTION = {
  CONFIRM: 'deploy_confirm',
  REJECT: 'deploy_reject'
};

/** Deploy scope kinds (mirror backend DeployScopeKind). */
export const DEPLOY_SCOPE_KIND = {
  GLOBAL: 'GLOBAL',
  WORKSPACE: 'WORKSPACE'
};

/**
 * Stable identity key for a deploy scope option, used both as a React list key and
 * to track the user's selection across re-renders. WORKSPACE scopes are distinguished
 * by their `workspaceId`; GLOBAL has none.
 * @param {{kind: string, workspaceId?: string}} scope
 * @returns {string}
 */
export const getDeployScopeKey = scope => (scope ? `${scope.kind}:${scope.workspaceId || ''}` : '');

// Content types for AI generation
export const CONTENT_TYPES = {
  TEXT: 'text',
  CODE: 'code',
  HTML: 'html'
};

// Tab types
export const TAB_TYPES = {
  UNIVERSAL: 'universal',
  CONTEXTUAL: 'contextual'
};

// Editor context handlers
export const EDITOR_CONTEXT_HANDLERS = {
  GET_CURRENT_TEXT: 'getCurrentText',
  UPDATE_CONTEXT_BEFORE_REQUEST: 'updateContextBeforeRequest',
  UPDATE_LEXICAL_CONTENT: 'updateLexicalContent',
  GET_CURRENT_SCRIPT: 'getCurrentScript',
  UPDATE_SCRIPT_CONTENT: 'updateScriptContent'
};

// Polling configuration
export const POLLING_INTERVAL = 1000;
// Client-side watchdog: how long the chat waits on one request before giving up and surfacing a
// timeout error instead of spinning forever. Guards against a request that never leaves the
// "processing" state (e.g. after a transient backend 500), which otherwise hangs the typing
// indicator with no way to recover. Ten minutes is well above any normal agent run.
//
// Stated in time and not in polls (it used to be `POLLING_MAX_ATTEMPTS = 600`, meant to be read as
// 600 × 1s). A budget counted in polls is only worth ten minutes while exactly one poll per second
// happens, and every extra poll — a duplicated chain, a retry, a shorter interval — spends the
// user's patience without a second of it passing. Measured on the stand at regr-20260816-r1: 600
// polls of one request burned in two minutes, then in eight to fifteen seconds, so the config agent
// (which thinks for one to ten minutes) never once reached its answer in the panel
// (D-B2d-CHAT-POLL-BUDGET). Wall-clock time cannot be spent faster than it passes.
export const POLLING_TIMEOUT_MS = 10 * 60 * 1000;

// How long the field services (text, script, content) wait for their own request. They poll it
// themselves rather than through `usePolling`, and each used to hold a private
// `MAX_POLLING_ATTEMPTS = 120` — two minutes against the backend's thirty
// (`REQUEST_TIMEOUT_MINUTES` in citeck-ai: up to nine provider calls with a ten-minute read timeout
// each, cut off by the controller). Fifteen times too early, and the answer that arrived after the
// client had given up was held by the server for another hour with nobody left to collect it
// (D-G-FE-TIMEOUT). One constant for the three, matched to the limit that actually decides the
// outcome.
export const FIELD_AI_TIMEOUT_MS = 30 * 60 * 1000;

// The wait between polls grows, so that thirty minutes do not become eighteen hundred requests: a
// quick answer is still noticed within a second, a long one is checked every five. The ramp is over
// the first half-minute — past that the request is plainly not a quick one.
export const FIELD_AI_POLL_INTERVAL_MIN_MS = POLLING_INTERVAL;
export const FIELD_AI_POLL_INTERVAL_MAX_MS = 5000;
export const FIELD_AI_POLL_RAMP_MS = 30 * 1000;

/**
 * How long to wait before the next poll, given how long this request has been waited on already.
 * @param {number} waitedMs - Total wait scheduled so far
 * @returns {number} Delay in ms, between the minimum and the maximum interval
 */
export const getFieldAiPollDelay = waitedMs => {
  const progress = Math.min(1, Math.max(0, waitedMs) / FIELD_AI_POLL_RAMP_MS);
  return Math.round(FIELD_AI_POLL_INTERVAL_MIN_MS + progress * (FIELD_AI_POLL_INTERVAL_MAX_MS - FIELD_AI_POLL_INTERVAL_MIN_MS));
};

// Lifetime of the persisted chat session record (sessionStorage), matched to what the backend
// actually keeps: `ConversationDataStore.DATA_EXPIRY_HOURS` in citeck-ai retires a conversation 24 h
// after its last write, and the record is worthless past that point. Deliberately NOT the polling
// window — that is the client's own watchdog, and expiring the record with it threw away exactly the
// long-running generations the persistence exists to rescue (D-B-14).
export const CHAT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Separate, much shorter horizon for resuming the request itself: citeck-ai kills a request after
// `REQUEST_TIMEOUT_MINUTES` (30) and drops the finished result `COMPLETED_RETENTION_MINUTES` (60)
// later, so 90 min is the longest a stored `requestId` can still answer anything. Past it the id is
// dropped while the conversation is kept — resuming would only fetch a 404 and show "request lost"
// for a chat the user can otherwise carry on using.
export const CHAT_REQUEST_RESUME_TTL_MS = 90 * 60 * 1000;

// Chat dimensions
export const CHAT_DIMENSIONS = {
  DEFAULT_WIDTH: 480,
  DEFAULT_HEIGHT: 680,
  MIN_WIDTH: 300,
  MIN_HEIGHT: 300
};

// Autocomplete
export const AUTOCOMPLETE_QUERY_THRESHOLD = 2;

// Context artifact type icons
export const CONTEXT_ARTIFACT_ICONS = {
  DATA_TYPE: 'fa-database',
  FORM: 'fa-file-text-o',
  BPMN_PROCESS: 'fa-sitemap',
  UNKNOWN: 'fa-cube'
};

export const getContextArtifactIcon = type => CONTEXT_ARTIFACT_ICONS[type] || CONTEXT_ARTIFACT_ICONS.UNKNOWN;

/**
 * Agent execution engine kinds returned by /ai-agent/list (DTO field `engine`).
 * Mirrors backend enum AgentEngine; the list-DTO omits `engine` for legacy agents,
 * in which case the agent is treated as operational (TOOL_LOOP).
 */
export const AGENT_ENGINE = {
  TOOL_LOOP: 'TOOL_LOOP',
  CONFIG: 'CONFIG'
};

/** Id of the built-in platform configuration agent (CONFIG engine). */
export const PLATFORM_CONFIG_AGENT_ID = 'platform-config-agent';

/**
 * Build the `agentRef` a request must carry to address a specific agent
 * (backend resolves the agent by the id after `@`).
 * @param {string} id - agent local id (e.g. 'platform-config-agent')
 * @returns {string} e.g. 'emodel/ai-agent@platform-config-agent'
 */
export const buildAgentRef = id => `emodel/ai-agent@${id}`;

/**
 * `agentRef` of the platform configuration agent. Script editing (COREDEV-323 FE-M5)
 * routes here: the backend's `editScript` tool reads the `editing.script` context and
 * returns the `script_writing` diff. Replaces the removed `forceIntent: SCRIPT_WRITING`
 * intent path (editing dispatch is now keyed on `editing.type`, not `forceIntent`).
 */
export const PLATFORM_CONFIG_AGENT_REF = buildAgentRef(PLATFORM_CONFIG_AGENT_ID);

/**
 * Resolve the engine of an agent list item with a safe fallback.
 * `engine`/`icon`/localized fields are absent from the list-DTO for legacy agents →
 * anything that is not explicitly CONFIG is rendered as operational TOOL_LOOP.
 * @param {{engine?: string}} agent
 * @returns {string} one of AGENT_ENGINE
 */
export const getAgentEngine = agent => (agent && agent.engine === AGENT_ENGINE.CONFIG ? AGENT_ENGINE.CONFIG : AGENT_ENGINE.TOOL_LOOP);

/** FontAwesome icon per agent engine. */
export const AGENT_ENGINE_ICONS = {
  [AGENT_ENGINE.TOOL_LOOP]: 'fa-robot',
  [AGENT_ENGINE.CONFIG]: 'fa-cogs'
};

export const getAgentEngineIcon = engine => AGENT_ENGINE_ICONS[engine] || AGENT_ENGINE_ICONS[AGENT_ENGINE.TOOL_LOOP];

/** i18n key for the human-readable engine group label shown as a badge in the selector. */
export const AGENT_ENGINE_LABEL_KEYS = {
  [AGENT_ENGINE.TOOL_LOOP]: 'ai-agent.engine.operational',
  [AGENT_ENGINE.CONFIG]: 'ai-agent.engine.config'
};

export const getAgentEngineLabelKey = engine => AGENT_ENGINE_LABEL_KEYS[engine] || AGENT_ENGINE_LABEL_KEYS[AGENT_ENGINE.TOOL_LOOP];

/**
 * Derive artifact type icon from a record ref string.
 * Useful when records are added via @ mention and don't carry an explicit artifact type.
 * @param {string} recordRef - e.g. 'uiserv/form@my-form', 'emodel/type@my-type'
 * @returns {string} FontAwesome icon class
 */
export const getRecordRefIcon = recordRef => {
  if (!recordRef) return CONTEXT_ARTIFACT_ICONS.UNKNOWN;
  if (recordRef.startsWith('uiserv/form@') || recordRef.includes('/form@')) return CONTEXT_ARTIFACT_ICONS.FORM;
  if (recordRef.startsWith('emodel/type@') || recordRef.includes('/type@')) return CONTEXT_ARTIFACT_ICONS.DATA_TYPE;
  if (recordRef.startsWith('emodel/bpmn-process@') || recordRef.includes('/bpmn-process@')) return CONTEXT_ARTIFACT_ICONS.BPMN_PROCESS;
  return CONTEXT_ARTIFACT_ICONS.DATA_TYPE; // default for records
};

/**
 * Whitelisted file extensions for AI assistant uploads, grouped by purpose.
 * Backend (multimodal analyzeFile + OpenAI/Anthropic) supports images, tables,
 * presentations and text/code natively in addition to the legacy document set.
 * Each extension is lower-case and includes a leading dot.
 */
export const FILE_UPLOAD_WHITELIST = {
  documents: ['.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt', '.md'],
  images: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  tables: ['.xlsx', '.xls', '.csv'],
  presentations: ['.pptx', '.ppt'],
  text_code: ['.json', '.xml', '.yaml', '.yml'],
  existing: ['.bpmn']
};

/**
 * Explicitly blocked extensions (UX guard, not a security boundary —
 * MIME-level enforcement happens on the backend).
 * `.svg` is blocked because of inline-script XSS risk when rendered.
 */
export const FILE_UPLOAD_BLOCKLIST = {
  executables: ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.dmg', '.pkg', '.app'],
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.iso'],
  media: ['.mp3', '.mp4', '.mov', '.avi', '.mkv', '.wav', '.ogg', '.webm', '.m4a'],
  svg: ['.svg']
};

/**
 * Client-side upload limits. Mirror backend defaults; backend remains the
 * source of truth, these are pre-flight UX guards to avoid wasted requests
 * (and OpenAI/Anthropic quota burned on payloads the backend would reject).
 *
 * @property {number} maxFileSizeMb - Per-file size limit in megabytes
 * @property {number} maxFilesPerUpload - Max number of files in a single upload action
 * @property {number} maxTotalSizeMb - Cumulative size limit per conversation in megabytes
 * @property {number} maxFileNameLength - Max characters in a filename (incl. extension)
 */
export const FILE_UPLOAD_LIMITS = {
  maxFileSizeMb: 10,
  maxFilesPerUpload: 5,
  maxTotalSizeMb: 50,
  maxFileNameLength: 200
};

/**
 * Extract the lower-case extension (with leading dot) from a filename.
 * Returns empty string if no extension is present (e.g. `Makefile`,
 * `.gitignore`, `file.`) or if the input is empty/null.
 * @param {string} filename
 * @returns {string} extension like `.pdf` or empty string
 */
export const getFileExtension = filename => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0) return ''; // no dot, or leading dot (hidden file w/o ext)
  if (lastDot === filename.length - 1) return ''; // trailing dot
  return filename.slice(lastDot).toLowerCase();
};

/**
 * Build a comma-separated `accept` string for `<input type="file">` from a
 * whitelist groups object. Extensions are normalised to lower-case and
 * deduplicated while preserving first-seen order.
 * @param {Object<string, string[]>} whitelistGroups
 * @returns {string}
 */
export const buildAcceptString = whitelistGroups => {
  if (!whitelistGroups || typeof whitelistGroups !== 'object') return '';
  const seen = new Set();
  const out = [];
  for (const group of Object.values(whitelistGroups)) {
    if (!Array.isArray(group)) continue;
    for (const ext of group) {
      if (typeof ext !== 'string' || !ext) continue;
      const normalised = ext.toLowerCase();
      if (!seen.has(normalised)) {
        seen.add(normalised);
        out.push(normalised);
      }
    }
  }
  return out.join(',');
};

/**
 * Check whether a filename's extension is present in any whitelist group.
 * @param {string} filename
 * @param {Object<string, string[]>} whitelistGroups
 * @returns {boolean}
 */
export const isExtensionAllowed = (filename, whitelistGroups) => {
  const ext = getFileExtension(filename);
  if (!ext || !whitelistGroups || typeof whitelistGroups !== 'object') return false;
  for (const group of Object.values(whitelistGroups)) {
    if (Array.isArray(group) && group.some(e => typeof e === 'string' && e.toLowerCase() === ext)) {
      return true;
    }
  }
  return false;
};

/**
 * Check whether a filename's extension is present in any blocklist group.
 * @param {string} filename
 * @param {Object<string, string[]>} blocklist
 * @returns {boolean}
 */
export const isExtensionBlocked = (filename, blocklist) => {
  const ext = getFileExtension(filename);
  if (!ext || !blocklist || typeof blocklist !== 'object') return false;
  for (const group of Object.values(blocklist)) {
    if (Array.isArray(group) && group.some(e => typeof e === 'string' && e.toLowerCase() === ext)) {
      return true;
    }
  }
  return false;
};

/**
 * Pre-built `accept` string for `<input type="file">` covering all whitelisted
 * extensions. Kept as a module-level constant so the file picker filter stays
 * in sync with `validateFile` without rebuilding on every render.
 */
export const FILE_UPLOAD_ACCEPT_STRING = buildAcceptString(FILE_UPLOAD_WHITELIST);

const BLOCKED_MIME_TYPES = new Set([
  // Executables
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/vnd.microsoft.portable-executable',
  'application/x-executable',
  'application/x-bat',
  'application/x-sh',
  'application/x-shellscript',
  'application/x-msi',
  'application/x-apple-diskimage',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-iso9660-image',
  // SVG (XSS protection)
  'image/svg+xml'
]);

/**
 * Check whether a MIME type belongs to a category we explicitly disallow on
 * drag-over (executables, archives, SVG, audio/*, video/*). Used to filter
 * the drop-zone highlight; the authoritative reject still happens after drop
 * via extension-based `validateFile`.
 * @param {string} mimeType
 * @returns {boolean}
 */
export const isBlockedMimeType = mimeType => {
  if (!mimeType || typeof mimeType !== 'string') return false;
  const mt = mimeType.toLowerCase();
  if (mt.startsWith('audio/')) return true;
  if (mt.startsWith('video/')) return true;
  return BLOCKED_MIME_TYPES.has(mt);
};

// Allowed MIME types corresponding to FILE_UPLOAD_WHITELIST extensions.
// image/* is handled via prefix match (excluding image/svg+xml in the blocklist).
const ALLOWED_MIME_TYPES = new Set([
  // documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'text/rtf',
  'text/plain',
  'text/markdown',
  // tables
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  // presentations
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // text/code
  'application/json',
  'application/xml',
  'text/xml',
  'application/x-yaml',
  'application/yaml',
  'text/yaml',
  'text/x-yaml'
]);

/**
 * Permissive MIME values that we treat as "could be a valid file" during
 * drag-over: empty string (browser doesn't know the type, e.g. `.bpmn`,
 * `.yaml`) and `application/octet-stream` (common "unknown binary" fallback).
 * The authoritative extension check still runs on drop.
 */
const PERMISSIVE_DRAG_MIME_TYPES = new Set(['', 'application/octet-stream']);

/**
 * Check whether a MIME type is allowed to trigger the drop-zone highlight.
 * Returns true for: empty / `application/octet-stream` (permissive — browsers
 * report these for unknown extensions like `.bpmn`/`.yaml`), all `image/*`
 * except SVG, or any explicit whitelist member. Anything else (e.g.
 * `application/javascript`, `text/x-python`) returns false even if it's not
 * in the executables/archives/media blocklist.
 * @param {string} mimeType
 * @returns {boolean}
 */
export const isAllowedDraggedMimeType = mimeType => {
  if (mimeType == null || typeof mimeType !== 'string') return false;
  const mt = mimeType.toLowerCase();
  if (PERMISSIVE_DRAG_MIME_TYPES.has(mt)) return true;
  if (isBlockedMimeType(mt)) return false;
  if (mt.startsWith('image/')) return true; // svg+xml already rejected by blocklist above
  return ALLOWED_MIME_TYPES.has(mt);
};

/**
 * Returns true if a `DataTransferItemList` (or any array-like of `{kind, type}`)
 * contains at least one file-kind item whose MIME passes
 * `isAllowedDraggedMimeType` (whitelist + permissive-empty/octet-stream).
 *
 * Note: in `dragover` the browser only exposes `kind` and `type` (MIME) for
 * security — filenames/extensions become available only on `drop`. So this
 * is a coarse pre-filter; final extension-based validation happens on `drop`
 * via `validateBatch` + `validateFile` (driven by `handleFileUpload`).
 *
 * @param {DataTransferItemList|Array<{kind:string,type:string}>} items
 * @returns {boolean}
 */
export const hasValidDraggedFile = items => {
  if (!items) return false;
  const len = typeof items.length === 'number' ? items.length : 0;
  if (!len) return false;
  for (let i = 0; i < len; i++) {
    const item = items[i];
    if (!item || item.kind !== 'file') continue;
    if (isAllowedDraggedMimeType(item.type)) return true;
  }
  return false;
};

// API endpoints
export const API_ENDPOINTS = {
  UNIVERSAL_ASYNC: '/gateway/ai/api/assistant/universal/async',
  UNIVERSAL_STATUS: '/gateway/ai/api/assistant/universal',
  UNIVERSAL_CONVERSATION: '/gateway/ai/api/assistant/universal/conversation',
  BPMN_ASYNC: '/gateway/ai/api/assistant/bpmn/async',
  BPMN_STATUS: '/gateway/ai/api/assistant/bpmn',
  BPMN_CONVERSATION: '/gateway/ai/api/assistant/bpmn/conversation',
  SEND_MAIL: '/gateway/ai/api/assistant/send-mail',
  FILE_UPLOAD: '/gateway/ai/api/assistant/upload-file',
  AGENT_LIST: '/gateway/ai/api/ai-agent/list'
};
