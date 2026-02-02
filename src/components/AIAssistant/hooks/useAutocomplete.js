import { useState, useCallback, useEffect, useRef } from 'react';
import additionalContextService from '../AdditionalContextService';
import { ADDITIONAL_CONTEXT_TYPES, AUTOCOMPLETE_QUERY_THRESHOLD } from '../constants';

/**
 * Hook for managing @ autocomplete functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.getAdditionalContext - Function to get additional context
 * @param {Function} options.toggleAdditionalContext - Function to toggle context
 * @param {Function} options.addRecordToContext - Function to add record to context
 * @param {Object} options.additionalContext - Current additional context state
 * @param {string[]} options.selectedAdditionalContext - Selected context types
 * @returns {Object} Autocomplete state and handlers
 */
const useAutocomplete = (options = {}) => {
  const {
    getAdditionalContext,
    toggleAdditionalContext,
    addRecordToContext,
    additionalContext,
    selectedAdditionalContext
  } = options;

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [currentRecordForAutocomplete, setCurrentRecordForAutocomplete] = useState(null);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState([]);

  const searchTimeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search records by display name
  const searchRecordsByDisp = useCallback(async (query, type) => {
    if (!query || query.length < AUTOCOMPLETE_QUERY_THRESHOLD) {
      return [];
    }

    setIsSearching(true);

    try {
      const results = await additionalContextService.searchRecordsByDisp(query, type);
      setIsSearching(false);
      return results || [];
    } catch (error) {
      console.error('Error searching records:', error);
      setIsSearching(false);
      return [];
    }
  }, []);

  // Handle input change for autocomplete
  const handleAutocompleteInputChange = useCallback(async (value, cursorPosition, textareaElement) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const queryAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      if (queryAfterAt.length >= 0 && !queryAfterAt.includes(' ')) {
        setAutocompleteQuery(queryAfterAt);
        setSelectedAutocompleteIndex(0);
        setShowAutocomplete(true);

        // Load current record for autocomplete
        if (getAdditionalContext) {
          const data = await getAdditionalContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
          setCurrentRecordForAutocomplete(data);

          // Search for records if query length exceeds threshold
          if (queryAfterAt.length >= AUTOCOMPLETE_QUERY_THRESHOLD && data && data.type) {
            const results = await searchRecordsByDisp(queryAfterAt, data.type);
            setSearchResults(results);
          } else {
            setSearchResults([]);
          }

          // Load available documents
          const docs = await getAdditionalContext(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS);
          setAvailableDocuments(docs || []);
        }

        // Calculate autocomplete position
        if (textareaElement) {
          const rect = textareaElement.getBoundingClientRect();
          const lines = textBeforeCursor.split('\n');
          const currentLineIndex = lines.length - 1;
          const currentLineText = lines[currentLineIndex];

          const lineHeight = 20;
          const charWidth = 8;
          const padding = 12;

          const top = rect.top + padding + (currentLineIndex * lineHeight) + lineHeight + 5;
          const left = rect.left + padding + (currentLineText.length * charWidth);

          setAutocompletePosition({
            top: Math.min(top, window.innerHeight - 200),
            left: Math.min(left, window.innerWidth - 300)
          });
        }
      } else {
        hideAutocomplete();
      }
    } else {
      hideAutocomplete();
    }
  }, [getAdditionalContext, searchRecordsByDisp]);

  // Hide autocomplete
  const hideAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
    setSelectedAutocompleteIndex(0);
    setSearchResults([]);
    setAvailableDocuments([]);
  }, []);

  // Get filtered autocomplete options
  const getFilteredAutocompleteOptions = useCallback(() => {
    const options = [];
    const query = autocompleteQuery.toLowerCase();

    // Add current record option
    if (currentRecordForAutocomplete) {
      const recordLabel = currentRecordForAutocomplete.displayName || 'Текущая карточка';
      if (!query || recordLabel.toLowerCase().includes(query)) {
        options.push({
          type: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
          label: recordLabel,
          icon: 'fa-file-text-o',
          data: currentRecordForAutocomplete
        });
      }
    }

    // Add search results
    searchResults.forEach(result => {
      options.push({
        type: 'search_result',
        label: result.displayName || result.recordRef,
        icon: 'fa-search',
        data: result
      });
    });

    // Add available documents
    availableDocuments.forEach(doc => {
      const docLabel = doc.displayName || doc.recordRef;
      if (!query || docLabel.toLowerCase().includes(query)) {
        options.push({
          type: ADDITIONAL_CONTEXT_TYPES.DOCUMENTS,
          label: docLabel,
          icon: 'fa-file-o',
          data: doc
        });
      }
    });

    return options;
  }, [autocompleteQuery, currentRecordForAutocomplete, searchResults, availableDocuments]);

  // Insert context mention into message
  const insertContextMention = useCallback(async (
    contextType,
    recordData,
    currentMessage,
    setMessage,
    textareaRef
  ) => {
    let contextLabel = 'карточка';
    let contextDataToAdd = null;

    if (contextType === 'search_result' && recordData) {
      contextLabel = recordData.displayName || recordData.recordRef;
      contextDataToAdd = recordData;
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) {
      const contextData = getAdditionalContext
        ? await getAdditionalContext(contextType)
        : null;
      if (contextData) {
        contextLabel = contextData.displayName || contextData.recordRef || 'карточка';
        contextDataToAdd = contextData;
      }
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS && recordData) {
      contextLabel = recordData.displayName || recordData.recordRef;
      contextDataToAdd = recordData;
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES && recordData) {
      contextLabel = recordData.displayName || recordData.attribute;
      contextDataToAdd = recordData;
    }

    // Replace @ mention with context label
    const cursorPosition = textareaRef?.current?.selectionStart || currentMessage.length;
    const textBeforeCursor = currentMessage.substring(0, cursorPosition);
    const textAfterCursor = currentMessage.substring(cursorPosition);

    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const newText = textBeforeCursor.substring(0, lastAtIndex) +
      `@${contextLabel} ` +
      textAfterCursor;

    setMessage(newText);
    hideAutocomplete();

    // Set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef?.current) {
        const newCursorPosition = lastAtIndex + contextLabel.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);

    // Add context data to additional context
    if (contextDataToAdd) {
      if (contextType === 'search_result') {
        addRecordToContext?.(contextDataToAdd);
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) {
        toggleAdditionalContext?.(contextType, contextDataToAdd);
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES) {
        // Attributes handled separately
      } else {
        toggleAdditionalContext?.(contextType);
      }
    }
  }, [getAdditionalContext, toggleAdditionalContext, addRecordToContext, hideAutocomplete]);

  // Handle keyboard navigation in autocomplete
  const handleAutocompleteKeyDown = useCallback((e, filteredOptions) => {
    if (!showAutocomplete || filteredOptions.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedAutocompleteIndex(prev =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
      return true;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedAutocompleteIndex(prev =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
      return true;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const selectedOption = filteredOptions[selectedAutocompleteIndex];
      if (selectedOption) {
        return selectedOption;
      }
    }

    if (e.key === 'Escape') {
      hideAutocomplete();
      return true;
    }

    return false;
  }, [showAutocomplete, selectedAutocompleteIndex, hideAutocomplete]);

  return {
    // State
    showAutocomplete,
    autocompletePosition,
    autocompleteQuery,
    selectedAutocompleteIndex,
    searchResults,
    isSearching,
    availableDocuments,
    currentRecordForAutocomplete,

    // Actions
    handleAutocompleteInputChange,
    hideAutocomplete,
    getFilteredAutocompleteOptions,
    insertContextMention,
    handleAutocompleteKeyDown,
    setSelectedAutocompleteIndex
  };
};

export default useAutocomplete;
