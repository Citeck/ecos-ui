/**
 * Utility functions for AIAssistant components
 */

/**
 * Generates a UUID v4 string
 * @returns {string} UUID string
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Determines the status of a stage based on current progress
 * @param {string} stageName - Name of the stage
 * @param {number} currentProgress - Current progress value (0-100)
 * @param {Object} progressRange - Object with min and max progress values for this stage
 * @returns {'pending'|'completed'|'active'} Stage status
 */
export const getStageStatus = (stageName, currentProgress, progressRange) => {
  if (!progressRange) return 'pending';

  const { min, max } = progressRange;

  if (currentProgress < min) return 'pending';
  if (currentProgress > max) return 'completed';
  return 'active';
};

/**
 * Formats timestamp to HH:MM format
 * @param {Date} timestamp - Date object
 * @returns {string} Formatted time string
 */
export const formatMessageTime = (timestamp) => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Truncates text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
