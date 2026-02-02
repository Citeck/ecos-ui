/**
 * Additional Context Service
 * Manages additional context (records, documents, attributes) for AI Assistant universal chat
 */

import Records from '../Records';
import { getRecordRef } from '@/helpers/urls';
import { ADDITIONAL_CONTEXT_TYPES } from './constants';

/** Record data for context */
export interface RecordData {
  recordRef: string;
  displayName: string;
  type: string;
}

/** Document data for context */
export interface DocumentData {
  recordRef: string;
  displayName: string;
  type: string;
  typeDisp: string;
  parentRef: string;
}

/** Attribute data for context */
export interface AttributeData {
  recordRef: string;
  attribute: string;
  displayName: string;
}

/** Additional context state */
export interface AdditionalContext {
  records: RecordData[];
  attributes: AttributeData[];
  documents: DocumentData[];
}

type SetStateAction<T> = T | ((prev: T) => T);
type Dispatch<T> = (value: SetStateAction<T>) => void;

class AdditionalContextService {
  /**
   * Load record data from server
   */
  async loadRecordData(recordRef: string): Promise<RecordData> {
    const recordData = await Records.get(recordRef).load({
      displayName: '?disp',
      type: '_type?id'
    });

    return {
      recordRef: recordRef,
      displayName: recordData.displayName || recordRef,
      type: recordData.type || 'unknown'
    };
  }

  /**
   * Load current record data from URL
   */
  async loadCurrentRecordData(): Promise<RecordData | null> {
    const recordRef = getRecordRef();
    if (!recordRef) return null;

    return this.loadRecordData(recordRef);
  }

  /**
   * Load documents for current record
   */
  async loadDocumentsData(): Promise<DocumentData[]> {
    const currentRecordRef = getRecordRef();
    if (!currentRecordRef) return [];

    try {
      const documentsData = await Records.get(currentRecordRef).load(
        'docs:documents[]{.id, _type{.id, .disp}, .disp, _parent?id}'
      );

      return documentsData.map((doc: Record<string, unknown>) => ({
        recordRef: doc['.id'] as string,
        displayName: doc['.disp'] as string,
        type: (doc['_type{.id, .disp}'] as Record<string, string>)['.id'],
        typeDisp: (doc['_type{.id, .disp}'] as Record<string, string>)['.disp'],
        parentRef: doc['_parent'] as string
      }));
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  }

  /**
   * Load attribute data
   */
  async loadAttributeData(recordRef: string, attribute: string): Promise<AttributeData> {
    const attrInfo = await Records.get(recordRef).load({
      name: '_type.attributeById.' + attribute + '.name'
    });

    return {
      recordRef: recordRef || '',
      attribute: attribute,
      displayName: attrInfo.name || ''
    };
  }

  /**
   * Check if record already exists in context
   */
  isRecordInContext(recordRef: string, records: RecordData[]): boolean {
    return records.some(record => record.recordRef === recordRef);
  }

  /**
   * Check if attribute already exists in context
   */
  isAttributeInContext(recordRef: string, attribute: string, attributes: AttributeData[]): boolean {
    return attributes.some(attr => attr.recordRef === recordRef && attr.attribute === attribute);
  }

  /**
   * Add text to message if not already present
   */
  addTextToMessage(text: string, setMessage: Dispatch<string>): void {
    setMessage((prev: string) => {
      if (!prev.includes(text.trim())) {
        return prev + text;
      }
      return prev;
    });
  }

  /**
   * Add context type to selected types if not already included
   */
  addContextType(
    contextType: string,
    selectedTypes: string[],
    setSelectedTypes: Dispatch<string[]>
  ): void {
    if (!selectedTypes.includes(contextType)) {
      setSelectedTypes((prev: string[]) => [...prev, contextType]);
    }
  }

  /**
   * Handle adding record context from external components
   */
  async handleAddRecordContext(
    recordRef: string,
    additionalContext: AdditionalContext,
    setAdditionalContext: Dispatch<AdditionalContext>,
    selectedTypes: string[],
    setSelectedTypes: Dispatch<string[]>,
    _setMessage?: Dispatch<string>
  ): Promise<boolean> {
    if (this.isRecordInContext(recordRef, additionalContext.records)) {
      return false;
    }

    try {
      const recordData = await this.loadRecordData(recordRef);

      setAdditionalContext((prev: AdditionalContext) => ({
        ...prev,
        records: [...prev.records, recordData]
      }));

      this.addContextType(
        ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
        selectedTypes,
        setSelectedTypes
      );

      return true;
    } catch (error) {
      console.error('Error loading record data:', error);
      return false;
    }
  }

  /**
   * Handle adding attribute context from external components
   */
  async handleAddAttributeContext(
    recordRef: string,
    attribute: string,
    additionalContext: AdditionalContext,
    setAdditionalContext: Dispatch<AdditionalContext>,
    selectedTypes: string[],
    setSelectedTypes: Dispatch<string[]>,
    _setMessage?: Dispatch<string>
  ): Promise<boolean> {
    if (this.isAttributeInContext(recordRef, attribute, additionalContext.attributes)) {
      return false;
    }

    const attributeData = await this.loadAttributeData(recordRef, attribute);

    setAdditionalContext((prev: AdditionalContext) => ({
      ...prev,
      attributes: [...prev.attributes, attributeData]
    }));

    this.addContextType(
      ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES,
      selectedTypes,
      setSelectedTypes
    );

    return true;
  }

  /**
   * Toggle record context (add/remove)
   */
  toggleRecordContext(
    recordData: RecordData,
    additionalContext: AdditionalContext,
    setAdditionalContext: Dispatch<AdditionalContext>,
    selectedTypes: string[],
    setSelectedTypes: Dispatch<string[]>
  ): void {
    const existingRecordIndex = additionalContext.records.findIndex(
      record => record.recordRef === recordData.recordRef
    );

    if (existingRecordIndex !== -1) {
      setAdditionalContext((prev: AdditionalContext) => ({
        ...prev,
        records: prev.records.filter((_, index) => index !== existingRecordIndex)
      }));

      if (additionalContext.records.length === 1) {
        setSelectedTypes((prev: string[]) =>
          prev.filter(c => c !== ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD)
        );
      }
    } else {
      setAdditionalContext((prev: AdditionalContext) => ({
        ...prev,
        records: [...prev.records, recordData]
      }));

      this.addContextType(
        ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
        selectedTypes,
        setSelectedTypes
      );
    }
  }

  /**
   * Toggle document context (add/remove)
   */
  toggleDocumentContext(
    documentData: DocumentData,
    additionalContext: AdditionalContext,
    setAdditionalContext: Dispatch<AdditionalContext>,
    selectedTypes: string[],
    setSelectedTypes: Dispatch<string[]>
  ): void {
    const existingDocumentIndex = additionalContext.documents.findIndex(
      doc => doc.recordRef === documentData.recordRef
    );

    if (existingDocumentIndex !== -1) {
      setAdditionalContext((prev: AdditionalContext) => ({
        ...prev,
        documents: prev.documents.filter((_, index) => index !== existingDocumentIndex)
      }));

      if (additionalContext.documents.length === 1) {
        setSelectedTypes((prev: string[]) =>
          prev.filter(c => c !== ADDITIONAL_CONTEXT_TYPES.DOCUMENTS)
        );
      }
    } else {
      setAdditionalContext((prev: AdditionalContext) => ({
        ...prev,
        documents: [...prev.documents, documentData]
      }));

      this.addContextType(
        ADDITIONAL_CONTEXT_TYPES.DOCUMENTS,
        selectedTypes,
        setSelectedTypes
      );
    }
  }
}

export default new AdditionalContextService();
