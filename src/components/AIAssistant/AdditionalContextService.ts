/**
 * Additional Context Service
 * Manages additional context (records, documents, attributes) for AI Assistant universal chat
 */

import Records from '../Records';
import { getRecordRef } from '@/helpers/urls';
import { ADDITIONAL_CONTEXT_TYPES } from './constants';
import type { WorkspaceContext } from './types';

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
    const record = Records.get(recordRef);
    record.reset();

    const recordData = await record.load({
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
        parentRef: (doc['_parent?id'] as string) || currentRecordRef
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
      setAdditionalContext((prev: AdditionalContext) => {
        const updatedRecords = prev.records.filter(r => r.recordRef !== recordData.recordRef);
        if (updatedRecords.length === 0) {
          setSelectedTypes((prevTypes: string[]) =>
            prevTypes.filter(c => c !== ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD)
          );
        }
        return { ...prev, records: updatedRecords };
      });
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
   * Load workspace context (name and basic info)
   */
  async loadWorkspaceContext(workspaceId: string): Promise<WorkspaceContext | null> {
    if (!workspaceId) return null;

    try {
      const data = await Records.get(`emodel/workspace@${workspaceId}`).load({
        workspaceName: '?disp'
      });

      return {
        workspaceId,
        workspaceName: data.workspaceName || workspaceId
      };
    } catch (error) {
      console.error('Error loading workspace context:', error);
      return null;
    }
  }


  /**
   * Search records by display name and type
   */
  async searchRecordsByDisp(query: string, type: string): Promise<RecordData[]> {
    if (!query || !type) return [];

    try {
      const result = await Records.query(
        {
          ecosType: type.replace('emodel/type@', ''),
          language: 'predicate',
          query: {
            t: 'contains',
            a: '_disp',
            v: query
          },
          page: { maxItems: 10 },
          sortBy: [{ attribute: '_modified', ascending: false }]
        },
        {
          displayName: '?disp',
          type: '_type?id'
        }
      );

      return (result.records || []).map((record: any) => ({
        recordRef: record.id,
        displayName: record.displayName || record.id,
        type: record.type || type
      }));
    } catch (error) {
      console.error('Error searching records by disp:', error);
      return [];
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
      setAdditionalContext((prev: AdditionalContext) => {
        const updatedDocuments = prev.documents.filter(d => d.recordRef !== documentData.recordRef);
        if (updatedDocuments.length === 0) {
          setSelectedTypes((prevTypes: string[]) =>
            prevTypes.filter(c => c !== ADDITIONAL_CONTEXT_TYPES.DOCUMENTS)
          );
        }
        return { ...prev, documents: updatedDocuments };
      });
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
