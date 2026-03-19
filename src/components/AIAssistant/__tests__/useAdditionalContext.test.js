import { renderHook, act } from '@testing-library/react';
import useAdditionalContext from '../hooks/useAdditionalContext';
import additionalContextService from '../AdditionalContextService';
import { AI_ASSISTANT_EVENTS, ADDITIONAL_CONTEXT_TYPES } from '../constants';

jest.mock('../AdditionalContextService', () => ({
  __esModule: true,
  default: {
    loadCurrentRecordData: jest.fn(),
    loadDocumentsData: jest.fn(),
    loadWorkspaceContext: jest.fn().mockResolvedValue(null),
    toggleRecordContext: jest.fn(),
    toggleDocumentContext: jest.fn(),
    handleAddRecordContext: jest.fn(),
    handleAddAttributeContext: jest.fn(),
    isRecordInContext: jest.fn().mockReturnValue(false)
  }
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-ws')
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
        window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
          detail: {
            contextType: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
            recordRef: 'rec-1'
          }
        }));
      });

      expect(additionalContextService.handleAddRecordContext).toHaveBeenCalled();
      expect(onContextAdded).toHaveBeenCalledWith(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
    });

    it('handles ATTRIBUTES context event with await', async () => {
      additionalContextService.handleAddAttributeContext.mockResolvedValue(true);
      const onContextAdded = jest.fn();

      renderHook(() => useAdditionalContext({ onContextAdded }));

      await act(async () => {
        window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
          detail: {
            contextType: ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES,
            recordRef: 'rec-1',
            attribute: 'status'
          }
        }));
      });

      expect(additionalContextService.handleAddAttributeContext).toHaveBeenCalled();
      expect(onContextAdded).toHaveBeenCalledWith(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES);
    });

    it('handles SCRIPT_CONTEXT event', async () => {
      const onScriptContextAdded = jest.fn();

      const { result } = renderHook(() => useAdditionalContext({ onScriptContextAdded }));

      await act(async () => {
        window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
          detail: {
            contextType: ADDITIONAL_CONTEXT_TYPES.SCRIPT_CONTEXT,
            scriptContextType: 'dev_console'
          }
        }));
      });

      expect(result.current.scriptContext).toEqual({ scriptContextType: 'dev_console' });
      expect(onScriptContextAdded).toHaveBeenCalledWith('dev_console');
    });

    it('strips -alias- suffix from recordRef', async () => {
      additionalContextService.handleAddRecordContext.mockResolvedValue(true);

      renderHook(() => useAdditionalContext());

      await act(async () => {
        window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
          detail: {
            contextType: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
            recordRef: 'rec-1-alias-some-alias'
          }
        }));
      });

      const call = additionalContextService.handleAddRecordContext.mock.calls[0];
      expect(call[0]).toBe('rec-1');
    });
  });

  describe('ADD_TEXT_REFERENCE event', () => {
    it('sets selected text context and updates message', async () => {
      const setMessage = jest.fn();
      const onTextReferenceAdded = jest.fn();

      const { result } = renderHook(() =>
        useAdditionalContext({ setMessage, onTextReferenceAdded })
      );

      await act(async () => {
        window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_TEXT_REFERENCE, {
          detail: { reference: 'myRef', selectedText: 'hello world' }
        }));
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

  it('cleans up event listeners on unmount', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useAdditionalContext());

    expect(addSpy).toHaveBeenCalledWith(
      AI_ASSISTANT_EVENTS.ADD_CONTEXT,
      expect.any(Function)
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      AI_ASSISTANT_EVENTS.ADD_CONTEXT,
      expect.any(Function)
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
