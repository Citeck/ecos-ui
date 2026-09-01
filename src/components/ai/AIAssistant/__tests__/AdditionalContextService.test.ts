jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('@/helpers/urls', () => ({
  getRecordRef: jest.fn()
}));

import Records from '@citeck/records-core';

import additionalContextService from '../AdditionalContextService';

import type { AdditionalContext, RecordData, DocumentData } from '../AdditionalContextService';

import { ADDITIONAL_CONTEXT_TYPES } from '@/components/ai/AIAssistant/constants';
import { getRecordRef } from '@/helpers/urls';

const mockRecords = Records as jest.Mocked<typeof Records>;
const mockGetRecordRef = getRecordRef as jest.MockedFunction<typeof getRecordRef>;

describe('AdditionalContextService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addTextToMessage', () => {
    it('appends text when not already present', () => {
      const setMessage = jest.fn();
      additionalContextService.addTextToMessage(' new text', setMessage);

      // Call the updater function passed to setMessage
      const updater = setMessage.mock.calls[0][0];
      const result = updater('existing');
      expect(result).toBe('existing new text');
    });

    it('does not append when text already present', () => {
      const setMessage = jest.fn();
      additionalContextService.addTextToMessage(' existing', setMessage);

      const updater = setMessage.mock.calls[0][0];
      const result = updater('already existing text');
      expect(result).toBe('already existing text');
    });
  });

  describe('addContextType', () => {
    it('adds context type when not already present', () => {
      const setSelectedTypes = jest.fn();
      additionalContextService.addContextType('records', [], setSelectedTypes);

      const updater = setSelectedTypes.mock.calls[0][0];
      const result = updater(['existing']);
      expect(result).toEqual(['existing', 'records']);
    });

    it('does not add when already present', () => {
      const setSelectedTypes = jest.fn();
      additionalContextService.addContextType('records', ['records'], setSelectedTypes);

      expect(setSelectedTypes).not.toHaveBeenCalled();
    });
  });

  describe('loadRecordData', () => {
    it('loads record data from Records API', async () => {
      mockRecords.get.mockReturnValue({
        reset: jest.fn(),
        load: jest.fn().mockResolvedValue({
          displayName: 'Test Record',
          type: 'emodel/type@test'
        })
      } as any);

      const result = await additionalContextService.loadRecordData('rec-1');

      expect(result).toEqual({
        recordRef: 'rec-1',
        displayName: 'Test Record',
        type: 'emodel/type@test'
      });
    });

    it('uses recordRef as fallback displayName', async () => {
      mockRecords.get.mockReturnValue({
        reset: jest.fn(),
        load: jest.fn().mockResolvedValue({
          displayName: '',
          type: ''
        })
      } as any);

      const result = await additionalContextService.loadRecordData('rec-1');

      expect(result.displayName).toBe('rec-1');
      expect(result.type).toBe('unknown');
    });
  });

  describe('loadCurrentRecordData', () => {
    it('returns null when no record ref in URL', async () => {
      mockGetRecordRef.mockReturnValue(undefined);

      const result = await additionalContextService.loadCurrentRecordData();

      expect(result).toBeNull();
    });

    it('loads current record when ref exists', async () => {
      mockGetRecordRef.mockReturnValue('rec-1');
      mockRecords.get.mockReturnValue({
        reset: jest.fn(),
        load: jest.fn().mockResolvedValue({
          displayName: 'Current',
          type: 'type1'
        })
      } as any);

      const result = await additionalContextService.loadCurrentRecordData();

      expect(result).toEqual({
        recordRef: 'rec-1',
        displayName: 'Current',
        type: 'type1'
      });
    });

    // The reference that leaves here is compared against the chat context, and `syncCurrentRecord`
    // puts the record there with the alias already cut off. Keeping it on this side made the two
    // forms of the same reference look like two records: the current record was offered by the `@`
    // dropdown although its chip was on screen, and listed a second time as its own search result
    // (D-B-18). `isSameRecordRef` cannot bridge the difference — it normalises the application
    // prefix, not the alias.
    it('cuts the -alias- suffix off the reference taken from the address', async () => {
      mockGetRecordRef.mockReturnValue('emodel/contract@rec-1-alias-abc');
      const load = jest.fn().mockResolvedValue({ displayName: 'Current', type: 'type1' });
      mockRecords.get.mockReturnValue({ reset: jest.fn(), load } as any);

      const result = await additionalContextService.loadCurrentRecordData();

      expect(mockRecords.get).toHaveBeenCalledWith('emodel/contract@rec-1');
      expect(result).toEqual({
        recordRef: 'emodel/contract@rec-1',
        displayName: 'Current',
        type: 'type1'
      });
    });

    it('returns null when the address carries nothing but an alias suffix', async () => {
      mockGetRecordRef.mockReturnValue('-alias-abc');

      const result = await additionalContextService.loadCurrentRecordData();

      expect(result).toBeNull();
      expect(mockRecords.get).not.toHaveBeenCalled();
    });
  });

  describe('loadDocumentsData', () => {
    it('returns empty array when no record ref', async () => {
      mockGetRecordRef.mockReturnValue(undefined);

      const result = await additionalContextService.loadDocumentsData();

      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetRecordRef.mockReturnValue('rec-1');
      mockRecords.get.mockReturnValue({
        load: jest.fn().mockRejectedValue(new Error('fail'))
      } as any);

      const result = await additionalContextService.loadDocumentsData();

      expect(result).toEqual([]);
      errorSpy.mockRestore();
    });

    // Same cut as in `loadCurrentRecordData`, and for the same consequence: `parentRef` falls back
    // to this reference and travels into the request as the document's parent record, so with the
    // alias left on it the parent is written differently from the very record whose chip is on
    // screen — one record sent, and shown, twice.
    it('cuts the -alias- suffix off the reference it loads the documents by', async () => {
      mockGetRecordRef.mockReturnValue('emodel/contract@rec-1-alias-abc');
      const load = jest.fn().mockResolvedValue([{ '.id': 'doc-1', '.disp': 'Договор.pdf', '_type{.id, .disp}': { '.id': 'attach' } }]);
      mockRecords.get.mockReturnValue({ load } as any);

      const result = await additionalContextService.loadDocumentsData();

      expect(mockRecords.get).toHaveBeenCalledWith('emodel/contract@rec-1');
      expect(result[0].parentRef).toBe('emodel/contract@rec-1');
    });

    it('returns empty array when the address carries nothing but an alias suffix', async () => {
      mockGetRecordRef.mockReturnValue('-alias-abc');

      const result = await additionalContextService.loadDocumentsData();

      expect(result).toEqual([]);
      expect(mockRecords.get).not.toHaveBeenCalled();
    });
  });

  // The guard behind the duplicate-chip defects: the same record reaches it written as the page
  // address has it (`emodel/type@id`) and as a search result returned it (`type@id`), so `===`
  // would let it into the context a second time.
  describe('isRecordInContext', () => {
    const record = (recordRef: string): RecordData => ({ recordRef, displayName: 'R', type: 't' });

    it('recognises the same record written with and without the application prefix', () => {
      expect(additionalContextService.isRecordInContext('type@employee', [record('emodel/type@employee')])).toBe(true);
      expect(additionalContextService.isRecordInContext('emodel/type@employee', [record('type@employee')])).toBe(true);
    });

    it('recognises an identical reference', () => {
      expect(additionalContextService.isRecordInContext('emodel/type@employee', [record('emodel/type@employee')])).toBe(true);
    });

    it('keeps two records of different applications apart', () => {
      expect(additionalContextService.isRecordInContext('alfresco/type@employee', [record('emodel/type@employee')])).toBe(false);
    });

    it('does not match a different record', () => {
      expect(additionalContextService.isRecordInContext('emodel/type@manager', [record('emodel/type@employee')])).toBe(false);
    });

    it('reports nothing in an empty context', () => {
      expect(additionalContextService.isRecordInContext('emodel/type@employee', [])).toBe(false);
    });
  });

  describe('toggleRecordContext', () => {
    const emptyContext: AdditionalContext = { records: [], attributes: [], documents: [] };

    it('adds record when not in context', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const record: RecordData = { recordRef: 'rec-1', displayName: 'R1', type: 't1' };

      additionalContextService.toggleRecordContext(record, emptyContext, setAdditionalContext, [], setSelectedTypes);

      const updater = setAdditionalContext.mock.calls[0][0];
      const result = updater(emptyContext);
      expect(result.records).toHaveLength(1);
      expect(result.records[0].recordRef).toBe('rec-1');
    });

    it('removes record when already in context', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const record: RecordData = { recordRef: 'rec-1', displayName: 'R1', type: 't1' };
      const context: AdditionalContext = {
        records: [record],
        attributes: [],
        documents: []
      };

      additionalContextService.toggleRecordContext(
        record,
        context,
        setAdditionalContext,
        [ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD],
        setSelectedTypes
      );

      const updater = setAdditionalContext.mock.calls[0][0];
      const result = updater(context);
      expect(result.records).toHaveLength(0);
    });

    it('removes context type when last record removed', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const record: RecordData = { recordRef: 'rec-1', displayName: 'R1', type: 't1' };
      const context: AdditionalContext = {
        records: [record],
        attributes: [],
        documents: []
      };

      additionalContextService.toggleRecordContext(
        record,
        context,
        setAdditionalContext,
        [ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD],
        setSelectedTypes
      );

      // Now setSelectedTypes is called from inside the setAdditionalContext updater
      // So we need to invoke the setAdditionalContext updater first
      const contextUpdater = setAdditionalContext.mock.calls[0][0];
      contextUpdater(context);

      const typeUpdater = setSelectedTypes.mock.calls[0][0];
      const result = typeUpdater([ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, ADDITIONAL_CONTEXT_TYPES.DOCUMENTS]);
      expect(result).not.toContain(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
    });
  });

  describe('removeRecordFromContext', () => {
    it('removes record and keeps other records', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const context: AdditionalContext = {
        records: [
          { recordRef: 'rec-1', displayName: 'R1', type: 't1' },
          { recordRef: 'rec-2', displayName: 'R2', type: 't1' }
        ],
        attributes: [],
        documents: []
      };

      additionalContextService.removeRecordFromContext('rec-1', setAdditionalContext, setSelectedTypes);

      const updater = setAdditionalContext.mock.calls[0][0];
      const result = updater(context);
      expect(result.records).toEqual([{ recordRef: 'rec-2', displayName: 'R2', type: 't1' }]);
      expect(setSelectedTypes).not.toHaveBeenCalled();
    });

    it('removes CURRENT_RECORD type when last record removed', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const context: AdditionalContext = {
        records: [{ recordRef: 'rec-1', displayName: 'R1', type: 't1' }],
        attributes: [],
        documents: []
      };

      additionalContextService.removeRecordFromContext('rec-1', setAdditionalContext, setSelectedTypes);

      const updater = setAdditionalContext.mock.calls[0][0];
      const result = updater(context);
      expect(result.records).toHaveLength(0);

      const typeUpdater = setSelectedTypes.mock.calls[0][0];
      expect(typeUpdater([ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, ADDITIONAL_CONTEXT_TYPES.DOCUMENTS])).toEqual([
        ADDITIONAL_CONTEXT_TYPES.DOCUMENTS
      ]);
    });

    it('returns same state when record is not in context', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const context: AdditionalContext = {
        records: [{ recordRef: 'rec-2', displayName: 'R2', type: 't1' }],
        attributes: [],
        documents: []
      };

      additionalContextService.removeRecordFromContext('rec-1', setAdditionalContext, setSelectedTypes);

      const updater = setAdditionalContext.mock.calls[0][0];
      expect(updater(context)).toBe(context);
      expect(setSelectedTypes).not.toHaveBeenCalled();
    });
  });

  describe('toggleDocumentContext', () => {
    const emptyContext: AdditionalContext = { records: [], attributes: [], documents: [] };

    it('adds document when not in context', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const doc: DocumentData = {
        recordRef: 'doc-1',
        displayName: 'Doc',
        type: 'type',
        typeDisp: 'Type',
        parentRef: 'rec-1'
      };

      additionalContextService.toggleDocumentContext(doc, emptyContext, setAdditionalContext, [], setSelectedTypes);

      const updater = setAdditionalContext.mock.calls[0][0];
      const result = updater(emptyContext);
      expect(result.documents).toHaveLength(1);
    });

    it('removes document when already in context', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const doc: DocumentData = {
        recordRef: 'doc-1',
        displayName: 'Doc',
        type: 'type',
        typeDisp: 'Type',
        parentRef: 'rec-1'
      };
      const context: AdditionalContext = {
        records: [],
        attributes: [],
        documents: [doc]
      };

      additionalContextService.toggleDocumentContext(
        doc,
        context,
        setAdditionalContext,
        [ADDITIONAL_CONTEXT_TYPES.DOCUMENTS],
        setSelectedTypes
      );

      const updater = setAdditionalContext.mock.calls[0][0];
      const result = updater(context);
      expect(result.documents).toHaveLength(0);
    });
  });

  describe('loadWorkspaceContext', () => {
    it('returns null when workspaceId is empty', async () => {
      const result = await additionalContextService.loadWorkspaceContext('');
      expect(result).toBeNull();
    });

    it('loads workspace context from Records API', async () => {
      mockRecords.get.mockReturnValue({
        load: jest.fn().mockResolvedValue({
          workspaceName: 'My Workspace'
        })
      } as any);

      const result = await additionalContextService.loadWorkspaceContext('test-ws');

      expect(mockRecords.get).toHaveBeenCalledWith('emodel/workspace@test-ws');
      expect(result).toEqual({
        workspaceId: 'test-ws',
        workspaceName: 'My Workspace'
      });
    });

    it('uses workspaceId as fallback name', async () => {
      mockRecords.get.mockReturnValue({
        load: jest.fn().mockResolvedValue({
          workspaceName: ''
        })
      } as any);

      const result = await additionalContextService.loadWorkspaceContext('test-ws');

      // `?.` rather than `!`: a null result yields `undefined` and fails the assertion just the
      // same, without the lint-forbidden non-null assertion.
      expect(result?.workspaceName).toBe('test-ws');
    });

    it('returns null on error', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRecords.get.mockReturnValue({
        load: jest.fn().mockRejectedValue(new Error('fail'))
      } as any);

      const result = await additionalContextService.loadWorkspaceContext('test-ws');

      expect(result).toBeNull();
      errorSpy.mockRestore();
    });
  });

  describe('handleAddRecordContext', () => {
    const emptyContext: AdditionalContext = { records: [], attributes: [], documents: [] };

    it('returns false if record already in context', async () => {
      const context: AdditionalContext = {
        records: [{ recordRef: 'rec-1', displayName: 'R1', type: 't1' }],
        attributes: [],
        documents: []
      };

      const result = await additionalContextService.handleAddRecordContext('rec-1', context, jest.fn(), [], jest.fn());

      expect(result).toBe(false);
    });

    it('loads and adds record data', async () => {
      mockRecords.get.mockReturnValue({
        reset: jest.fn(),
        load: jest.fn().mockResolvedValue({
          displayName: 'New Record',
          type: 'type1'
        })
      } as any);

      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();

      const result = await additionalContextService.handleAddRecordContext(
        'rec-1',
        emptyContext,
        setAdditionalContext,
        [],
        setSelectedTypes
      );

      expect(result).toBe(true);
      expect(setAdditionalContext).toHaveBeenCalled();
    });

    it('returns false on error', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRecords.get.mockReturnValue({
        reset: jest.fn(),
        load: jest.fn().mockRejectedValue(new Error('fail'))
      } as any);

      const result = await additionalContextService.handleAddRecordContext('rec-1', emptyContext, jest.fn(), [], jest.fn());

      expect(result).toBe(false);
      errorSpy.mockRestore();
    });
  });
});
