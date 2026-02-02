import { useState, useEffect, useCallback } from 'react';

const DEFAULT_WIDTH = 350;
const DEFAULT_HEIGHT = 500;
const STORAGE_KEY = 'aiAssistantChatSize';

/**
 * Hook for managing chat window size with localStorage persistence
 * @param {Object} options - Configuration options
 * @param {number} options.defaultWidth - Default width (default: 350)
 * @param {number} options.defaultHeight - Default height (default: 500)
 * @param {string} options.storageKey - localStorage key (default: 'aiAssistantChatSize')
 * @returns {Object} { chatSize, handleResize }
 */
const useChatResize = (options = {}) => {
  const {
    defaultWidth = DEFAULT_WIDTH,
    defaultHeight = DEFAULT_HEIGHT,
    storageKey = STORAGE_KEY
  } = options;

  const [chatSize, setChatSize] = useState({
    width: defaultWidth,
    height: defaultHeight
  });

  // Load saved size from localStorage on mount
  useEffect(() => {
    const savedSize = localStorage.getItem(storageKey);
    if (savedSize) {
      try {
        const parsedSize = JSON.parse(savedSize);
        if (parsedSize.width && parsedSize.height) {
          setChatSize(parsedSize);
        }
      } catch (e) {
        console.error('Failed to parse saved chat size:', e);
      }
    }
  }, [storageKey]);

  // Handle resize event from ResizableBox
  const handleResize = useCallback((event, { size }) => {
    const { width, height } = size;
    setChatSize({ width, height });
    localStorage.setItem(storageKey, JSON.stringify({ width, height }));
  }, [storageKey]);

  return {
    chatSize,
    handleResize
  };
};

export default useChatResize;
