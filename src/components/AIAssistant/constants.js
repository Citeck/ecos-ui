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

/**
 * Get localized label for script context type
 * @param {string} contextType - Context type key (e.g., 'computed_attribute')
 * @returns {string} Localized label
 */
export const getScriptContextLabel = contextType => {
  const localeKey = SCRIPT_CONTEXT_TYPES[contextType];
  if (localeKey) {
    return t(`script-context.${localeKey}`);
  }
  return contextType || t('script-context.default');
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

// Chat dimensions
export const CHAT_DIMENSIONS = {
  DEFAULT_WIDTH: 350,
  DEFAULT_HEIGHT: 500,
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
