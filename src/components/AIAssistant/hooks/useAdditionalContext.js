import { useState, useCallback, useEffect } from 'react';
import additionalContextService from '../AdditionalContextService';
import { AI_ASSISTANT_EVENTS, ADDITIONAL_CONTEXT_TYPES } from '../constants';

/**
 * Hook for managing additional context (records, documents, attributes, text, scripts)
 * @param {Object} options - Configuration options
 * @param {Function} options.onContextAdded - Callback when context is added (receives contextType)
 * @param {Function} options.onTextReferenceAdded - Callback when text reference is added (receives { reference, selectedText })
 * @param {Function} options.onScriptContextAdded - Callback when script context is added (receives scriptContextType)
 * @param {Function} options.setMessage - Function to update message input
 * @returns {Object} Context state and handlers
 */
const useAdditionalContext = (options = {}) => {
  const {
    onContextAdded,
    onTextReferenceAdded,
    onScriptContextAdded,
    setMessage
  } = options;

  const [selectedAdditionalContext, setSelectedAdditionalContext] = useState([]);
  const [selectedTextContext, setSelectedTextContext] = useState(null);
  const [scriptContext, setScriptContext] = useState(null);
  const [additionalContext, setAdditionalContext] = useState({
    records: [],
    documents: [],
    attributes: []
  });

  // Get additional context data
  const getAdditionalContext = useCallback(async (contextType) => {
    try {
      switch (contextType) {
        case ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD:
          return await additionalContextService.loadCurrentRecordData();
        case ADDITIONAL_CONTEXT_TYPES.DOCUMENTS:
          return await additionalContextService.loadDocumentsData();
        default:
          return null;
      }
    } catch (error) {
      console.error('Error getting additional context:', error);
      return null;
    }
  }, []);

  // Toggle additional context
  const toggleAdditionalContext = useCallback(async (contextType, specificRecord = null) => {
    if (contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) {
      let recordData = specificRecord;
      if (!recordData) {
        recordData = await getAdditionalContext(contextType);
      }

      if (!recordData) return;

      additionalContextService.toggleRecordContext(
        recordData,
        additionalContext,
        setAdditionalContext,
        selectedAdditionalContext,
        setSelectedAdditionalContext
      );
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) {
      let documentData = specificRecord;
      if (!documentData) return;

      additionalContextService.toggleDocumentContext(
        documentData,
        additionalContext,
        setAdditionalContext,
        selectedAdditionalContext,
        setSelectedAdditionalContext
      );
    } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES) {
      if (!specificRecord) return;

      setAdditionalContext(prev => ({
        ...prev,
        attributes: [...prev.attributes, specificRecord]
      }));

      if (!selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES)) {
        setSelectedAdditionalContext(prev => [...prev, ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES]);
      }
    }
  }, [additionalContext, selectedAdditionalContext, getAdditionalContext]);

  // Remove selected text context
  const removeSelectedTextContext = useCallback(() => {
    if (selectedTextContext && selectedTextContext.reference && setMessage) {
      setMessage(prev => prev.replace(`@${selectedTextContext.reference} `, '').trim());
    }
    setSelectedTextContext(null);
  }, [selectedTextContext, setMessage]);

  // Remove script context
  const removeScriptContext = useCallback(() => {
    setScriptContext(null);
  }, []);

  // Clear all context
  const clearAllContext = useCallback(() => {
    setAdditionalContext({ records: [], documents: [], attributes: [] });
    setSelectedAdditionalContext([]);
    setSelectedTextContext(null);
    setScriptContext(null);
  }, []);

  // Add record to context
  const addRecordToContext = useCallback((recordData) => {
    setAdditionalContext(prev => ({
      ...prev,
      records: [...prev.records, recordData]
    }));

    if (!selectedAdditionalContext.includes(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD)) {
      setSelectedAdditionalContext(prev => [...prev, ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD]);
    }
  }, [selectedAdditionalContext]);

  // Handle external context events
  useEffect(() => {
    const handleAddContext = async (event) => {
      const { contextType, attribute } = event.detail;
      const recordRef = event.detail.recordRef ? event.detail.recordRef.split('-alias-')[0] : null;

      if (contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD && recordRef) {
        await additionalContextService.handleAddRecordContext(
          recordRef,
          additionalContext,
          setAdditionalContext,
          selectedAdditionalContext,
          setSelectedAdditionalContext,
          setMessage
        );
        onContextAdded?.(contextType);
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES && attribute) {
        additionalContextService.handleAddAttributeContext(
          recordRef,
          attribute,
          additionalContext,
          setAdditionalContext,
          selectedAdditionalContext,
          setSelectedAdditionalContext,
          setMessage
        );
        onContextAdded?.(contextType);
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.SCRIPT_CONTEXT && event.detail.scriptContextType) {
        setScriptContext({
          scriptContextType: event.detail.scriptContextType
        });
        onScriptContextAdded?.(event.detail.scriptContextType);
      }
    };

    const handleAddTextReference = (event) => {
      const { reference, selectedText } = event.detail;

      // Update message with reference
      if (setMessage) {
        setMessage(prev => {
          const newRef = `@${reference}`;
          if (prev.includes(newRef)) return prev;
          if (selectedTextContext?.reference) {
            const existingRef = `@${selectedTextContext.reference}`;
            if (prev.includes(existingRef)) {
              return prev.replace(existingRef, newRef);
            }
          }
          return prev.trim() + (prev.trim() ? ' ' : '') + `${newRef} `;
        });
      }

      setSelectedTextContext({
        text: selectedText,
        reference: reference
      });

      onTextReferenceAdded?.({ reference, selectedText });
    };

    window.addEventListener(AI_ASSISTANT_EVENTS.ADD_CONTEXT, handleAddContext);
    window.addEventListener(AI_ASSISTANT_EVENTS.ADD_TEXT_REFERENCE, handleAddTextReference);

    return () => {
      window.removeEventListener(AI_ASSISTANT_EVENTS.ADD_CONTEXT, handleAddContext);
      window.removeEventListener(AI_ASSISTANT_EVENTS.ADD_TEXT_REFERENCE, handleAddTextReference);
    };
  }, [
    additionalContext,
    selectedAdditionalContext,
    selectedTextContext,
    setMessage,
    onContextAdded,
    onTextReferenceAdded,
    onScriptContextAdded
  ]);

  return {
    // State
    selectedAdditionalContext,
    selectedTextContext,
    scriptContext,
    additionalContext,

    // Setters (for direct manipulation if needed)
    setSelectedAdditionalContext,
    setSelectedTextContext,
    setScriptContext,
    setAdditionalContext,

    // Actions
    getAdditionalContext,
    toggleAdditionalContext,
    removeSelectedTextContext,
    removeScriptContext,
    clearAllContext,
    addRecordToContext
  };
};

export default useAdditionalContext;
