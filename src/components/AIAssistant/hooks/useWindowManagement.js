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
    const handleKeyDown = (e) => {
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
    handleClose,
    handleMinimize,
    toggleChat
  };
};

export default useWindowManagement;
