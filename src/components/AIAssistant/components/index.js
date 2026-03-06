// AI Assistant UI Components

export { default as ChatHeader } from './ChatHeader';
export { default as ChatTabs } from './ChatTabs';
export { default as ChatWelcome } from './ChatWelcome';
export { default as ChatInput } from './ChatInput';
export { default as ChatContextTags } from './ChatContextTags';
export { default as EmailModal } from './EmailModal';
export { default as MessageList } from './MessageList';

// Message components
export * from './messages';

// Re-export TAB_TYPES from constants for backward compatibility
export { TAB_TYPES } from '../constants';
