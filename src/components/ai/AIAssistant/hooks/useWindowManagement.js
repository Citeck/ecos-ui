import { useState, useEffect, useCallback } from 'react';

import aiAssistantService from '../AIAssistantService';

/**
 * Hook for managing AI Assistant window state (open/minimized)
 * @returns {Object} Window management state and handlers
 */
const useWindowManagement = () => {
  const [isOpen, setIsOpen] = useState(aiAssistantService.isOpen);
  const [isMinimized, setIsMinimized] = useState(aiAssistantService.isMinimized);

  // Sync state with service
  useEffect(() => {
    const handleStateChange = (newIsOpen, newIsMinimized) => {
      setIsOpen(newIsOpen);
      setIsMinimized(newIsMinimized);
    };

    aiAssistantService.addListener(handleStateChange);

    return () => {
      aiAssistantService.removeListener(handleStateChange);
    };
  }, []);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    aiAssistantService.closeChat();
  }, []);

  const handleMinimize = useCallback(() => {
    const newState = aiAssistantService.toggleMinimize();
    setIsMinimized(newState);
    return newState;
  }, []);

  const toggleChat = useCallback(() => {
    aiAssistantService.toggleChat();
  }, []);

  return {
    isOpen,
    isMinimized,
    // Whether the chat is actually on screen. Not the same thing as `isOpen`: `toggleChat`
    // minimizes an open panel instead of closing it, so the toolbar button, the `Alt+I` shortcut
    // and the header minimize button all leave `isOpen` true while nothing of the chat is visible.
    // Anything driven by the user "opening the panel" — the D-B-14 request restoration, which the
    // chat itself advertises as «закройте и снова откройте панель» — has to follow this one, or the
    // only control that triggers it is the `×` in the chat header.
    isVisible: isOpen && !isMinimized,
    handleClose,
    handleMinimize,
    toggleChat
  };
};

export default useWindowManagement;
