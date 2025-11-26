import { useEffect } from 'react';

export const IS_APPLE = (() => {
  if (navigator.userAgentData && navigator.userAgentData.platform) {
    return /mac/i.test(navigator.userAgentData.platform);
  }

  return /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent);
})();

/**
 * Custom hook for handling keyboard shortcuts
 * @param {string} key - The key to listen for
 * @param {Object} modifiers - Object with modifier keys: { meta: boolean, alt: boolean, shift: boolean, ctrl: boolean }
 * @param {Function} callback - Function to call when shortcut is pressed
 * @param {Array} deps - Dependencies array
 */
export const useKeyboardShortcut = (key, modifiers, callback, deps = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key: eventKey, metaKey, altKey, shiftKey, ctrlKey } = event;

      if (eventKey.toLowerCase() === key.toLowerCase()) {
        const modifierMatch = Object.entries(modifiers).every(([modifier, expected]) => {
          switch (modifier) {
            case 'meta':
              return metaKey === expected;
            case 'alt':
              return altKey === expected;
            case 'shift':
              return shiftKey === expected;
            case 'ctrl':
              return ctrlKey === expected;
            default:
              return true;
          }
        });

        if (modifierMatch) {
          event.preventDefault();
          event.stopPropagation();
          callback(event);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ...deps]);
};
