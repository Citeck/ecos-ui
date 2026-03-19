jest.mock('../../Records', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('@/helpers/urls', () => ({
  getRecordRef: jest.fn()
}));

import additionalContextService from '../AdditionalContextService';
import type { AdditionalContext, RecordData, DocumentData } from '../AdditionalContextService';
import Records from '../../Records';
import { getRecordRef } from '@/helpers/urls';
import { ADDITIONAL_CONTEXT_TYPES } from '../constants';

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
  });

  describe('toggleRecordContext', () => {
    const emptyContext: AdditionalContext = { records: [], attributes: [], documents: [] };

    it('adds record when not in context', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const record: RecordData = { recordRef: 'rec-1', displayName: 'R1', type: 't1' };

      additionalContextService.toggleRecordContext(
        record, emptyContext, setAdditionalContext, [], setSelectedTypes
      );

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
        record, context, setAdditionalContext, [ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD], setSelectedTypes
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
        record, context, setAdditionalContext,
        [ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD], setSelectedTypes
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

  describe('toggleDocumentContext', () => {
    const emptyContext: AdditionalContext = { records: [], attributes: [], documents: [] };

    it('adds document when not in context', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const doc: DocumentData = {
        recordRef: 'doc-1', displayName: 'Doc', type: 'type', typeDisp: 'Type', parentRef: 'rec-1'
      };

      additionalContextService.toggleDocumentContext(
        doc, emptyContext, setAdditionalContext, [], setSelectedTypes
      );

      const updater = setAdditionalContext.mock.calls[0][0];
      const result = updater(emptyContext);
      expect(result.documents).toHaveLength(1);
    });

    it('removes document when already in context', () => {
      const setAdditionalContext = jest.fn();
      const setSelectedTypes = jest.fn();
      const doc: DocumentData = {
        recordRef: 'doc-1', displayName: 'Doc', type: 'type', typeDisp: 'Type', parentRef: 'rec-1'
      };
      const context: AdditionalContext = {
        records: [],
        attributes: [],
        documents: [doc]
      };

      additionalContextService.toggleDocumentContext(
        doc, context, setAdditionalContext,
        [ADDITIONAL_CONTEXT_TYPES.DOCUMENTS], setSelectedTypes
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

      expect(result!.workspaceName).toBe('test-ws');
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

      const result = await additionalContextService.handleAddRecordContext(
        'rec-1', context, jest.fn(), [], jest.fn()
      );

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
        'rec-1', emptyContext, setAdditionalContext, [], setSelectedTypes
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

      const result = await additionalContextService.handleAddRecordContext(
        'rec-1', emptyContext, jest.fn(), [], jest.fn()
      );

      expect(result).toBe(false);
      errorSpy.mockRestore();
    });
  });
});
