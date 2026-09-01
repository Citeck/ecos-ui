import { renderHook, act } from '@testing-library/react';

import additionalContextService from '../AdditionalContextService';
import useAdditionalContext from '../hooks/useAdditionalContext';

import { AI_ASSISTANT_EVENTS, ADDITIONAL_CONTEXT_TYPES } from '@/components/ai/AIAssistant/constants';
import { getRecordRef } from '@/helpers/urls';

jest.mock('../AdditionalContextService', () => ({
  __esModule: true,
  default: {
    loadRecordData: jest.fn(),
    loadCurrentRecordData: jest.fn(),
    loadDocumentsData: jest.fn(),
    loadWorkspaceContext: jest.fn().mockResolvedValue(null),
    toggleRecordContext: jest.fn(),
    toggleDocumentContext: jest.fn(),
    handleAddRecordContext: jest.fn(),
    handleAddAttributeContext: jest.fn(),
    removeRecordFromContext: jest.fn(),
    isRecordInContext: jest.fn().mockReturnValue(false)
  }
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-ws'),
  getRecordRef: jest.fn(() => '')
}));

jest.mock('@/services/PageService.js', () => ({
  Events: { CHANGE_URL_LINK_EVENT: 'page:change-url' }
}));

describe('useAdditionalContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty context', () => {
    const { result } = renderHook(() => useAdditionalContext());

    expect(result.current.additionalContext).toEqual({
      records: [],
      documents: [],
      attributes: []
    });
    expect(result.current.selectedAdditionalContext).toEqual([]);
    expect(result.current.selectedTextContext).toBeNull();
    expect(result.current.scriptContext).toBeNull();
  });

  it('loads workspace context on mount', async () => {
    const wsContext = { workspaceId: 'test-ws', workspaceName: 'Test' };
    additionalContextService.loadWorkspaceContext.mockResolvedValue(wsContext);

    const { result } = renderHook(() => useAdditionalContext());

    // Wait for async workspace load
    await act(async () => {});

    expect(additionalContextService.loadWorkspaceContext).toHaveBeenCalledWith('test-ws');
    expect(result.current.workspaceContext).toEqual(wsContext);
  });

  it('toggleAdditionalContext calls toggleRecordContext for CURRENT_RECORD', async () => {
    additionalContextService.loadCurrentRecordData.mockResolvedValue({
      recordRef: 'rec-1',
      displayName: 'R1',
      type: 't1'
    });

    const { result } = renderHook(() => useAdditionalContext());

    await act(async () => {
      await result.current.toggleAdditionalContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
    });

    expect(additionalContextService.toggleRecordContext).toHaveBeenCalled();
  });

  it('toggleAdditionalContext with specificRecord skips loading', async () => {
    const specificRecord = { recordRef: 'rec-1', displayName: 'R1', type: 't1' };

    const { result } = renderHook(() => useAdditionalContext());

    await act(async () => {
      await result.current.toggleAdditionalContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, specificRecord);
    });

    expect(additionalContextService.loadCurrentRecordData).not.toHaveBeenCalled();
    expect(additionalContextService.toggleRecordContext).toHaveBeenCalled();
  });

  it('toggleAdditionalContext calls toggleDocumentContext for DOCUMENTS', async () => {
    const doc = { recordRef: 'doc-1', displayName: 'D1', type: 't1', typeDisp: 'T', parentRef: 'r1' };

    const { result } = renderHook(() => useAdditionalContext());

    await act(async () => {
      await result.current.toggleAdditionalContext(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS, doc);
    });

    expect(additionalContextService.toggleDocumentContext).toHaveBeenCalled();
  });

  it('toggleAdditionalContext adds attribute context for ATTRIBUTES', async () => {
    const attr = { recordRef: 'rec-1', attribute: 'status', displayName: 'Status' };

    const { result } = renderHook(() => useAdditionalContext());

    await act(async () => {
      await result.current.toggleAdditionalContext(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES, attr);
    });

    expect(result.current.additionalContext.attributes).toHaveLength(1);
    expect(result.current.selectedAdditionalContext).toContain(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES);
  });

  it('clearAllContext resets all context state', () => {
    const { result } = renderHook(() => useAdditionalContext());

    // Add some context first
    act(() => {
      result.current.setAdditionalContext({
        records: [{ recordRef: 'r1', displayName: 'R1', type: 't' }],
        documents: [],
        attributes: []
      });
      result.current.setSelectedTextContext({ text: 'test', reference: 'ref' });
      result.current.setScriptContext({ scriptContextType: 'dev_console' });
    });

    act(() => {
      result.current.clearAllContext();
    });

    expect(result.current.additionalContext).toEqual({ records: [], documents: [], attributes: [] });
    expect(result.current.selectedAdditionalContext).toEqual([]);
    expect(result.current.selectedTextContext).toBeNull();
    expect(result.current.scriptContext).toBeNull();
  });

  it('removeSelectedTextContext clears text and removes @reference from message', () => {
    const setMessage = jest.fn();
    const { result } = renderHook(() => useAdditionalContext({ setMessage }));

    act(() => {
      result.current.setSelectedTextContext({ text: 'hello', reference: 'ref1' });
    });

    act(() => {
      result.current.removeSelectedTextContext();
    });

    expect(result.current.selectedTextContext).toBeNull();
    expect(setMessage).toHaveBeenCalled();
  });

  it('removeScriptContext clears script context', () => {
    const { result } = renderHook(() => useAdditionalContext());

    act(() => {
      result.current.setScriptContext({ scriptContextType: 'dev_console' });
    });

    act(() => {
      result.current.removeScriptContext();
    });

    expect(result.current.scriptContext).toBeNull();
  });

  it('addRecordToContext adds record and selects type', () => {
    const { result } = renderHook(() => useAdditionalContext());

    act(() => {
      result.current.addRecordToContext({ recordRef: 'r1', displayName: 'R1', type: 't' });
    });

    expect(result.current.additionalContext.records).toHaveLength(1);
    expect(result.current.selectedAdditionalContext).toContain(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
  });

  describe('ADD_CONTEXT event', () => {
    it('handles CURRENT_RECORD context event', async () => {
      additionalContextService.handleAddRecordContext.mockResolvedValue(true);
      const onContextAdded = jest.fn();

      renderHook(() => useAdditionalContext({ onContextAdded }));

      await act(async () => {
        window.dispatchEvent(
          new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
            detail: {
              contextType: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
              recordRef: 'rec-1'
            }
          })
        );
      });

      expect(additionalContextService.handleAddRecordContext).toHaveBeenCalled();
      expect(onContextAdded).toHaveBeenCalledWith(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
    });

    it('handles ATTRIBUTES context event with await', async () => {
      additionalContextService.handleAddAttributeContext.mockResolvedValue(true);
      const onContextAdded = jest.fn();

      renderHook(() => useAdditionalContext({ onContextAdded }));

      await act(async () => {
        window.dispatchEvent(
          new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
            detail: {
              contextType: ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES,
              recordRef: 'rec-1',
              attribute: 'status'
            }
          })
        );
      });

      expect(additionalContextService.handleAddAttributeContext).toHaveBeenCalled();
      expect(onContextAdded).toHaveBeenCalledWith(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES);
    });

    it('handles SCRIPT_CONTEXT event', async () => {
      const onScriptContextAdded = jest.fn();

      const { result } = renderHook(() => useAdditionalContext({ onScriptContextAdded }));

      await act(async () => {
        window.dispatchEvent(
          new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
            detail: {
              contextType: ADDITIONAL_CONTEXT_TYPES.SCRIPT_CONTEXT,
              scriptContextType: 'dev_console'
            }
          })
        );
      });

      expect(result.current.scriptContext).toEqual({ scriptContextType: 'dev_console' });
      expect(onScriptContextAdded).toHaveBeenCalledWith('dev_console');
    });

    it('strips -alias- suffix from recordRef', async () => {
      additionalContextService.handleAddRecordContext.mockResolvedValue(true);

      renderHook(() => useAdditionalContext());

      await act(async () => {
        window.dispatchEvent(
          new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
            detail: {
              contextType: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
              recordRef: 'rec-1-alias-some-alias'
            }
          })
        );
      });

      const call = additionalContextService.handleAddRecordContext.mock.calls[0];
      expect(call[0]).toBe('rec-1');
    });
  });

  describe('ADD_TEXT_REFERENCE event', () => {
    it('sets selected text context and updates message', async () => {
      const setMessage = jest.fn();
      const onTextReferenceAdded = jest.fn();

      const { result } = renderHook(() => useAdditionalContext({ setMessage, onTextReferenceAdded }));

      await act(async () => {
        window.dispatchEvent(
          new CustomEvent(AI_ASSISTANT_EVENTS.ADD_TEXT_REFERENCE, {
            detail: { reference: 'myRef', selectedText: 'hello world' }
          })
        );
      });

      expect(result.current.selectedTextContext).toEqual({
        text: 'hello world',
        reference: 'myRef'
      });
      expect(setMessage).toHaveBeenCalled();
      expect(onTextReferenceAdded).toHaveBeenCalledWith({
        reference: 'myRef',
        selectedText: 'hello world'
      });
    });
  });

  describe('current record auto-context (chat open)', () => {
    const CHANGE_URL_EVENT = 'page:change-url';

    it('auto-adds current record to context when chat is open', async () => {
      getRecordRef.mockReturnValue('rec-1');
      additionalContextService.loadRecordData.mockResolvedValue({ recordRef: 'rec-1', displayName: 'Doc 1', type: 't1' });

      const { result } = renderHook(() => useAdditionalContext({ isOpen: true }));

      await act(async () => {});

      expect(additionalContextService.loadRecordData).toHaveBeenCalledWith('rec-1');
      expect(result.current.additionalContext.records).toEqual([{ recordRef: 'rec-1', displayName: 'Doc 1', type: 't1' }]);
      expect(result.current.selectedAdditionalContext).toContain(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
    });

    it('does not auto-add when chat is closed', async () => {
      getRecordRef.mockReturnValue('rec-1');

      renderHook(() => useAdditionalContext({ isOpen: false }));

      await act(async () => {});

      expect(additionalContextService.loadRecordData).not.toHaveBeenCalled();
    });

    it('does nothing when URL has no recordRef', async () => {
      getRecordRef.mockReturnValue('');

      renderHook(() => useAdditionalContext({ isOpen: true }));

      await act(async () => {});

      expect(additionalContextService.loadRecordData).not.toHaveBeenCalled();
    });

    it('strips -alias- suffix from URL recordRef', async () => {
      getRecordRef.mockReturnValue('rec-1-alias-some-alias');
      additionalContextService.loadRecordData.mockResolvedValue({ recordRef: 'rec-1', displayName: 'Doc 1', type: 't1' });

      renderHook(() => useAdditionalContext({ isOpen: true }));

      await act(async () => {});

      expect(additionalContextService.loadRecordData).toHaveBeenCalledWith('rec-1');
    });

    it('replaces auto-added record when URL record changes', async () => {
      getRecordRef.mockReturnValue('rec-1');
      additionalContextService.loadRecordData.mockResolvedValue({ recordRef: 'rec-1', displayName: 'Doc 1', type: 't1' });

      renderHook(() => useAdditionalContext({ isOpen: true }));

      await act(async () => {});

      getRecordRef.mockReturnValue('rec-2');
      additionalContextService.loadRecordData.mockResolvedValue({ recordRef: 'rec-2', displayName: 'Doc 2', type: 't1' });

      await act(async () => {
        document.dispatchEvent(new Event(CHANGE_URL_EVENT));
      });

      expect(additionalContextService.removeRecordFromContext).toHaveBeenCalledWith('rec-1', expect.any(Function), expect.any(Function));
      expect(additionalContextService.loadRecordData).toHaveBeenLastCalledWith('rec-2');
    });

    it('removes auto-added record when navigating to a page without record', async () => {
      getRecordRef.mockReturnValue('rec-1');
      additionalContextService.loadRecordData.mockResolvedValue({ recordRef: 'rec-1', displayName: 'Doc 1', type: 't1' });

      renderHook(() => useAdditionalContext({ isOpen: true }));

      await act(async () => {});

      getRecordRef.mockReturnValue('');

      await act(async () => {
        document.dispatchEvent(new Event(CHANGE_URL_EVENT));
      });

      expect(additionalContextService.removeRecordFromContext).toHaveBeenCalledWith('rec-1', expect.any(Function), expect.any(Function));
    });

    it('does not reload when URL change keeps the same record', async () => {
      getRecordRef.mockReturnValue('rec-1');
      additionalContextService.loadRecordData.mockResolvedValue({ recordRef: 'rec-1', displayName: 'Doc 1', type: 't1' });

      renderHook(() => useAdditionalContext({ isOpen: true }));

      await act(async () => {});

      await act(async () => {
        document.dispatchEvent(new Event(CHANGE_URL_EVENT));
      });

      expect(additionalContextService.loadRecordData).toHaveBeenCalledTimes(1);
      expect(additionalContextService.removeRecordFromContext).not.toHaveBeenCalled();
    });

    it('re-adds current record when chat is reopened without duplicating context', async () => {
      getRecordRef.mockReturnValue('rec-1');
      additionalContextService.loadRecordData.mockResolvedValue({ recordRef: 'rec-1', displayName: 'Doc 1', type: 't1' });

      const { result, rerender } = renderHook(({ isOpen }) => useAdditionalContext({ isOpen }), {
        initialProps: { isOpen: true }
      });

      await act(async () => {});

      rerender({ isOpen: false });
      await act(async () => {});

      // Context survived the close; record must not duplicate on reopen
      additionalContextService.isRecordInContext.mockReturnValue(true);
      rerender({ isOpen: true });
      await act(async () => {});

      expect(result.current.additionalContext.records).toHaveLength(1);
      additionalContextService.isRecordInContext.mockReturnValue(false);
    });
  });

  // The documents branch of the same duplicate-chip defect the records branch is guarded against:
  // a document arrives from the `@` list as the server returned it and from the context as the page
  // address wrote it, so `===` would put two chips on screen for one file.
  describe('addDocumentToContext', () => {
    const doc = (recordRef, displayName = 'Договор.pdf') => ({ recordRef, displayName, type: 'attach', typeDisp: 'Вложение' });

    it('adds a document that is not in the context yet', () => {
      const { result } = renderHook(() => useAdditionalContext());

      act(() => {
        result.current.addDocumentToContext(doc('emodel/attachment@doc-1'));
      });

      expect(result.current.additionalContext.documents.map(d => d.recordRef)).toEqual(['emodel/attachment@doc-1']);
      expect(result.current.selectedAdditionalContext).toContain(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS);
    });

    it('ignores a document already held under a reference without the app prefix', () => {
      const { result } = renderHook(() => useAdditionalContext());

      act(() => {
        result.current.addDocumentToContext(doc('attachment@doc-1'));
      });
      act(() => {
        result.current.addDocumentToContext(doc('emodel/attachment@doc-1', 'Договор (копия).pdf'));
      });

      expect(result.current.additionalContext.documents).toHaveLength(1);
      expect(result.current.additionalContext.documents[0].displayName).toBe('Договор.pdf');
    });

    it('keeps documents of different applications that share a local id apart', () => {
      const { result } = renderHook(() => useAdditionalContext());

      act(() => {
        result.current.addDocumentToContext(doc('emodel/attachment@doc-1'));
      });
      act(() => {
        result.current.addDocumentToContext(doc('alfresco/attachment@doc-1'));
      });

      expect(result.current.additionalContext.documents).toHaveLength(2);
    });
  });

  it('cleans up event listeners on unmount', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useAdditionalContext());

    expect(addSpy).toHaveBeenCalledWith(AI_ASSISTANT_EVENTS.ADD_CONTEXT, expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(AI_ASSISTANT_EVENTS.ADD_CONTEXT, expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
