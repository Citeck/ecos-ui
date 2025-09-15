/**
 * Additional Context Service
 * Manages additional context (records, documents, attributes) for AI Assistant universal chat
 */

import Records from "../Records";
import { getRecordRef } from "@/helpers/urls";
import { ADDITIONAL_CONTEXT_TYPES } from "./constants";

class AdditionalContextService {
  /**
   * Load record data from server
   * @param {string} recordRef - Record reference
   * @returns {Promise<Object>} - Record data
   */
  async loadRecordData(recordRef) {
    const recordData = await Records.get(recordRef).load({
      displayName: "?disp",
      type: "_type?id"
    });

    return {
      recordRef: recordRef,
      displayName: recordData.displayName || recordRef,
      type: recordData.type || "unknown"
    };
  }

  /**
   * Load current record data from URL
   * @returns {Promise<Object|null>} - Current record data or null
   */
  async loadCurrentRecordData() {
    const recordRef = getRecordRef();
    if (!recordRef) return null;

    return this.loadRecordData(recordRef);
  }

  /**
   * Load documents for current record
   * @returns {Promise<Array>} - Documents array
   */
  async loadDocumentsData() {
    const currentRecordRef = getRecordRef();
    if (!currentRecordRef) return [];

    try {
      const documentsData = await Records.get(currentRecordRef).load(
        "docs:documents[]{.id, _type{.id, .disp}, .disp, _parent?id}"
      );

      return documentsData.map(doc => ({
        recordRef: doc[".id"],
        displayName: doc[".disp"],
        type: doc["_type{.id, .disp}"][".id"],
        typeDisp: doc["_type{.id, .disp}"][".disp"],
        parentRef: doc["_parent"]
      }));
    } catch (error) {
      console.error("Error loading documents:", error);
      return [];
    }
  }

  /**
   * Create attribute data object
   * @param {string} recordRef - Record reference
   * @param {string} attribute - Attribute name
   * @returns {Object} - Attribute data
   */
  async loadAttributeData(recordRef, attribute) {

    const attrInfo = await Records.get(recordRef).load({
      name: "_type.attributeById." + attribute + ".name"
    });

    return {
      recordRef: recordRef || "",
      attribute: attribute,
      displayName: attrInfo.name || ""
    };
  }

  /**
   * Check if record already exists in context
   * @param {string} recordRef - Record reference
   * @param {Array} records - Current records in context
   * @returns {boolean} - Whether record exists
   */
  isRecordInContext(recordRef, records) {
    return records.some(record => record.recordRef === recordRef);
  }

  /**
   * Check if attribute already exists in context
   * @param {string} recordRef - Record reference
   * @param {string} attribute - Attribute
   * @param {Object} attributes - Current attributes in context
   * @returns {boolean} - Whether attribute exists
   */
  isAttributeInContext(recordRef, attribute, attributes) {
    return attributes.some(attr => attr.recordRef === recordRef && attr.attribute === attribute);
  }

  /**
   * Add text to message if not already present
   * @param {string} text - Text to add
   * @param {Function} setMessage - State setter for message
   */
  addTextToMessage(text, setMessage) {
    setMessage(prev => {
      if (!prev.includes(text.trim())) {
        return prev + text;
      }
      return prev;
    });
  }

  /**
   * Add context type to selected types if not already included
   * @param {string} contextType - Context type to add
   * @param {Array} selectedTypes - Current selected types
   * @param {Function} setSelectedTypes - State setter for selected types
   */
  addContextType(contextType, selectedTypes, setSelectedTypes) {
    if (!selectedTypes.includes(contextType)) {
      setSelectedTypes(prev => [...prev, contextType]);
    }
  }

  /**
   * Handle adding record context from external components
   * @param {string} recordRef - Record reference
   * @param {Object} additionalContext - Current additional context
   * @param {Function} setAdditionalContext - Context setter
   * @param {Array} selectedTypes - Selected context types
   * @param {Function} setSelectedTypes - Selected types setter
   * @param {Function} setMessage - Message setter
   * @returns {Promise<boolean>} - Whether context was added
   */
  async handleAddRecordContext(
    recordRef,
    additionalContext,
    setAdditionalContext,
    selectedTypes,
    setSelectedTypes,
    setMessage
  ) {
    if (this.isRecordInContext(recordRef, additionalContext.records)) {
      return false;
    }

    try {
      const recordData = await this.loadRecordData(recordRef);

      // Add record to context
      setAdditionalContext(prev => ({
        ...prev,
        records: [...prev.records, recordData]
      }));

      // Add context type
      this.addContextType(
        ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
        selectedTypes,
        setSelectedTypes
      );

      return true;
    } catch (error) {
      console.error("Error loading record data:", error);
      return false;
    }
  }

  /**
   * Handle adding attribute context from external components
   * @param {string} recordRef - Record reference
   * @param {string} attribute - Attribute
   * @param {Object} additionalContext - Current additional context
   * @param {Function} setAdditionalContext - Context setter
   * @param {Array} selectedTypes - Selected context types
   * @param {Function} setSelectedTypes - Selected types setter
   * @param {Function} setMessage - Message setter
   * @returns {boolean} - Whether context was added
   */
  async handleAddAttributeContext(
    recordRef,
    attribute,
    additionalContext,
    setAdditionalContext,
    selectedTypes,
    setSelectedTypes,
    setMessage
  ) {
    if (this.isAttributeInContext(recordRef, attribute, additionalContext.attributes)) {
      return false;
    }

    // Create attribute data
    const attributeData = await this.loadAttributeData(recordRef, attribute);

    // Add attribute to context
    setAdditionalContext(prev => ({
      ...prev,
      attributes: [...prev.attributes, attributeData]
    }));

    // Add context type
    this.addContextType(
      ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES,
      selectedTypes,
      setSelectedTypes
    );

    return true;
  }

  /**
   * Toggle record context (add/remove)
   * @param {Object} recordData - Record data to toggle
   * @param {Object} additionalContext - Current additional context
   * @param {Function} setAdditionalContext - Context setter
   * @param {Array} selectedTypes - Selected context types
   * @param {Function} setSelectedTypes - Selected types setter
   */
  toggleRecordContext(recordData, additionalContext, setAdditionalContext, selectedTypes, setSelectedTypes) {
    const existingRecordIndex = additionalContext.records.findIndex(
      record => record.recordRef === recordData.recordRef
    );

    if (existingRecordIndex !== -1) {
      // Remove from context
      setAdditionalContext(prev => ({
        ...prev,
        records: prev.records.filter((_, index) => index !== existingRecordIndex)
      }));

      // If no more records, remove context type
      if (additionalContext.records.length === 1) {
        setSelectedTypes(prev => prev.filter(c => c !== ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD));
      }
    } else {
      // Add to context
      setAdditionalContext(prev => ({
        ...prev,
        records: [...prev.records, recordData]
      }));

      // Add context type
      this.addContextType(
        ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
        selectedTypes,
        setSelectedTypes
      );
    }
  }

  /**
   * Toggle document context (add/remove)
   * @param {Object} documentData - Document data to toggle
   * @param {Object} additionalContext - Current additional context
   * @param {Function} setAdditionalContext - Context setter
   * @param {Array} selectedTypes - Selected context types
   * @param {Function} setSelectedTypes - Selected types setter
   */
  toggleDocumentContext(documentData, additionalContext, setAdditionalContext, selectedTypes, setSelectedTypes) {
    const existingDocumentIndex = additionalContext.documents.findIndex(
      doc => doc.recordRef === documentData.recordRef
    );

    if (existingDocumentIndex !== -1) {
      // Remove from context
      setAdditionalContext(prev => ({
        ...prev,
        documents: prev.documents.filter((_, index) => index !== existingDocumentIndex)
      }));

      // If no more documents, remove context type
      if (additionalContext.documents.length === 1) {
        setSelectedTypes(prev => prev.filter(c => c !== ADDITIONAL_CONTEXT_TYPES.DOCUMENTS));
      }
    } else {
      // Add to context
      setAdditionalContext(prev => ({
        ...prev,
        documents: [...prev.documents, documentData]
      }));

      // Add context type
      this.addContextType(
        ADDITIONAL_CONTEXT_TYPES.DOCUMENTS,
        selectedTypes,
        setSelectedTypes
      );
    }
  }
}

export default new AdditionalContextService();
