// AI Assistant Hooks

// Phase 2: Independent hooks (no external component state dependencies)
export { default as useChatResize } from './useChatResize';
export { default as usePolling } from './usePolling';
export { default as useFileUpload } from './useFileUpload';

// Phase 4: Dependent hooks
export { default as useWindowManagement } from './useWindowManagement';
export { default as useAdditionalContext } from './useAdditionalContext';
export { default as useAutocomplete } from './useAutocomplete';
export { default as useUniversalChat } from './useUniversalChat';
export { default as useContextualChat } from './useContextualChat';
