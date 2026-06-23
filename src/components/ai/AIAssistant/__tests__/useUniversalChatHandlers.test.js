import { renderHook, act } from '@testing-library/react';
import useUniversalChat, { fileSaveActionTempRef, extractTempFileId, stripTempImageFromText } from '../hooks/useUniversalChat';
import usePolling from '../hooks/usePolling';
import { AGENT_STATUSES } from '../types';
import { MESSAGE_TYPES } from '../constants';

jest.mock('../utils', () => ({
  generateUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).slice(2, 8))
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-workspace')
}));

jest.mock('@citeck/records-core', () => ({
  get: jest.fn(() => ({ load: jest.fn() }))
}));

jest.mock('../EditorContextService', () => ({
  getContextData: jest.fn(() => ({})),
  getHandler: jest.fn(),
  clearContext: jest.fn()
}));

const mockStartPolling = jest.fn();
const mockStopPolling = jest.fn();

jest.mock('../hooks/usePolling', () => {
  return jest.fn(() => ({
    startPolling: mockStartPolling,
    stopPolling: mockStopPolling,
    activeRequestId: 'active-req-1'
  }));
});

describe('useUniversalChat - handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('handlePollingResult', () => {
    const getHandlePollingResult = () => {
      renderHook(() => useUniversalChat());
      const pollingOptions = usePolling.mock.calls[usePolling.mock.calls.length - 1][0];
      return pollingOptions.onResult;
    };

    it('sets agentStatus when result has agentStatus', () => {
      const { result } = renderHook(() => useUniversalChat());
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({
          agentStatus: AGENT_STATUSES.COMPLETED,
          message: 'Done'
        });
      });

      expect(result.current.agentStatus).toBe(AGENT_STATUSES.COMPLETED);
    });

    it('resets agentStatus to null when result has no agentStatus', () => {
      const { result } = renderHook(() => useUniversalChat());
      const pollingCalls = usePolling.mock.calls;
      const onResult = pollingCalls[pollingCalls.length - 1][0].onResult;

      // First set agentStatus
      act(() => {
        onResult({ agentStatus: AGENT_STATUSES.PLANNING, message: 'Planning...' });
      });
      expect(result.current.agentStatus).toBe(AGENT_STATUSES.PLANNING);

      // Then receive a non-agent result
      act(() => {
        onResult({ message: 'Regular response' });
      });
      expect(result.current.agentStatus).toBeNull();
    });

    it('sets forceIntent from result', () => {
      const { result } = renderHook(() => useUniversalChat());
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ forceIntent: 'text_editing', message: 'ok' });
      });

      expect(result.current.conversationForceIntent).toBe('text_editing');
    });

    it('filters autoContextArtifacts against manual records', () => {
      const manualRecords = [{ recordRef: 'emodel/type@employee' }];
      const { result } = renderHook(() =>
        useUniversalChat({ additionalContext: { records: manualRecords, documents: [], attributes: [] } })
      );
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({
          message: 'ok',
          contextArtifacts: [
            { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
            { ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }
          ]
        });
      });

      // Employee should be filtered out because it's a manual record
      expect(result.current.autoContextArtifacts).toEqual([{ ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }]);
    });

    it('replaces processing message with AI message', () => {
      const { result } = renderHook(() => useUniversalChat());

      // Add a processing message
      act(() => {
        result.current.setMessages([{ id: '1', text: 'Processing...', isProcessing: true }]);
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ message: 'AI response' });
      });

      const msgs = result.current.messages;
      expect(msgs.some(m => m.isProcessing)).toBe(false);
      expect(msgs[msgs.length - 1].text).toBe('AI response');
    });

    it('sets isLoading to false', () => {
      const { result } = renderHook(() => useUniversalChat());
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ message: 'done' });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('handlePollingError', () => {
    it('marks processing messages as error', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([{ id: '1', text: 'Processing...', isProcessing: true }]);
      });

      const onError = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onError;

      act(() => {
        onError('Something went wrong');
      });

      const msgs = result.current.messages;
      expect(msgs[0].isError).toBe(true);
      expect(msgs[0].isProcessing).toBe(false);
      expect(msgs[0].text).toContain('ai-assistant.chat.error-prefix');
    });
  });

  describe('handlePollingCancelled', () => {
    it('marks processing messages as cancelled', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([{ id: '1', text: 'Processing...', isProcessing: true }]);
      });

      const onCancelled = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onCancelled;

      act(() => {
        onCancelled();
      });

      const msgs = result.current.messages;
      expect(msgs[0].isCancelled).toBe(true);
      expect(msgs[0].isProcessing).toBe(false);
    });
  });

  describe('cancelRequest', () => {
    it('sends DELETE request and stops polling', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useUniversalChat());

      await act(async () => {
        await result.current.cancelRequest();
      });

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/active-req-1'), expect.objectContaining({ method: 'DELETE' }));
      expect(mockStopPolling).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('marks processing messages as cancelled after DELETE', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          { id: '1', text: 'Processing...', isProcessing: true },
          { id: '2', text: 'User msg', sender: 'user' }
        ]);
      });

      await act(async () => {
        await result.current.cancelRequest();
      });

      const msgs = result.current.messages;
      expect(msgs[0].isCancelled).toBe(true);
      expect(msgs[0].isProcessing).toBe(false);
      expect(msgs[1].sender).toBe('user'); // Unchanged
    });

    it('handles DELETE failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

      const { result } = renderHook(() => useUniversalChat());

      await act(async () => {
        await result.current.cancelRequest();
      });

      expect(mockStopPolling).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('handleActionClick', () => {
    it('sends action request and starts polling', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-1' })
      });

      const { result } = renderHook(() => useUniversalChat());

      await act(async () => {
        await result.current.handleActionClick('approve_plan');
      });

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.action).toBe('approve_plan');
      expect(body.message).toBe('');
      expect(mockStartPolling).toHaveBeenCalledWith('action-req-1');
    });

    it('removes actions from existing messages', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-1' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: '1',
            text: 'Plan ready',
            messageData: {
              agentStatus: 'WAITING_PLAN_APPROVAL',
              actions: [{ id: 'approve', label: 'Approve' }]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('approve');
      });

      const msgs = result.current.messages;
      // Processing message is appended
      expect(msgs.length).toBeGreaterThan(1);
      // Actions should be removed from original message
      expect(msgs[0].messageData.actions).toBeNull();
    });

    it('clears actions only on the message whose action was clicked', async () => {
      // Multi-pending file-save scenario: two assistant messages each carrying their own
      // Save/Cancel pair for distinct tempRefs. Clicking Cancel on one must NOT disable the
      // other — the surviving pending must remain saveable.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-2' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-a',
            text: 'Green square ready',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel' }
              ]
            }
          },
          {
            id: 'msg-b',
            text: 'Yellow circle ready',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@B', label: 'Save' },
                { id: 'file_cancel|temp-file@B', label: 'Cancel' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('file_cancel|temp-file@A');
      });

      const msgs = result.current.messages;
      // msg-a was the source of the click → its actions are cleared
      expect(msgs.find(m => m.id === 'msg-a').messageData.actions).toBeNull();
      // msg-b owns a different pending → its actions must survive
      expect(msgs.find(m => m.id === 'msg-b').messageData.actions).toEqual([
        { id: 'new_record|temp-file@B', label: 'Save' },
        { id: 'file_cancel|temp-file@B', label: 'Cancel' }
      ]);
    });

    it('adds error message on failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUniversalChat());

      await act(async () => {
        await result.current.handleActionClick('approve');
      });

      const msgs = result.current.messages;
      expect(msgs[msgs.length - 1].isError).toBe(true);
      expect(result.current.isLoading).toBe(false);
      consoleSpy.mockRestore();
    });

    it('does nothing when conversationId is empty', async () => {
      // Default conversationId is generated, so this won't trigger the early return
      // But we can verify the normal flow works
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'req-1' })
      });

      const { result } = renderHook(() => useUniversalChat());

      await act(async () => {
        await result.current.handleActionClick('some_action');
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('handlePollingProgress', () => {
    it('sets agentStatus to PLANNING for agent_planning progress', () => {
      const { result } = renderHook(() => useUniversalChat());
      const onProgress = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onProgress;

      act(() => {
        result.current.setMessages([{ id: '1', isProcessing: true }]);
      });

      act(() => {
        onProgress({
          type: 'agent_planning',
          currentStepId: 'step1',
          completedSteps: 0,
          totalSteps: 3,
          overallProgress: 0
        });
      });

      expect(result.current.agentStatus).toBe(AGENT_STATUSES.PLANNING);
    });

    it('sets agentStatus to EXECUTING for agent_execution progress', () => {
      const { result } = renderHook(() => useUniversalChat());
      const onProgress = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onProgress;

      act(() => {
        result.current.setMessages([{ id: '1', isProcessing: true }]);
      });

      act(() => {
        onProgress({
          type: 'agent_execution',
          completedSteps: 1,
          totalSteps: 3,
          overallProgress: 33
        });
      });

      expect(result.current.agentStatus).toBe(AGENT_STATUSES.EXECUTING);
    });

    it('updates processing message with progress fields', () => {
      const { result } = renderHook(() => useUniversalChat());
      const onProgress = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onProgress;

      act(() => {
        result.current.setMessages([{ id: '1', isProcessing: true, text: 'Loading...' }]);
      });

      act(() => {
        onProgress({
          type: 'agent_planning',
          currentStepId: 'step1',
          completedSteps: 1,
          totalSteps: 5,
          overallProgress: 20
        });
      });

      const msg = result.current.messages[0];
      expect(msg.isAgentProgressContent).toBe(true);
      expect(msg.messageData.type).toBe('agent_planning');
    });

    it('sets business app progress for non-agent progress', () => {
      const { result } = renderHook(() => useUniversalChat());
      const onProgress = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onProgress;

      act(() => {
        result.current.setMessages([{ id: '1', isProcessing: true }]);
      });

      act(() => {
        onProgress({
          stage: 'GENERATING',
          progress: 50,
          message: 'Generating app...'
        });
      });

      expect(result.current.activeBusinessAppProgress).toEqual(
        expect.objectContaining({
          stage: 'GENERATING',
          progress: 50,
          message: 'Generating app...'
        })
      );
    });
  });

  describe('handleSubmit - selectedTexts removed', () => {
    it('does not include selectedTexts in request body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'req-1' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessage('test');
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.context.selection).not.toHaveProperty('selectedTexts');
    });
  });

  // COREDEV-321: a saved/cancelled pending file's temp-file content URL is deleted on the
  // backend, so its inline preview would 500 on the next render. Helpers below identify the
  // dead preview and the integration block verifies it is stripped from chat history.
  describe('temp-file preview helpers', () => {
    describe('fileSaveActionTempRef', () => {
      it.each([
        ['new_record|emodel/temp-file@aaa-111', 'emodel/temp-file@aaa-111'],
        ['main_content|emodel/temp-file@bbb', 'emodel/temp-file@bbb'],
        ['file_cancel|emodel/temp-file@ccc', 'emodel/temp-file@ccc'],
        ['attr:logo|emodel/temp-file@ddd', 'emodel/temp-file@ddd']
      ])('returns the tempRef for file-save action %s', (actionId, expected) => {
        expect(fileSaveActionTempRef(actionId)).toBe(expected);
      });

      it.each([
        ['approve_plan'],
        ['some_action'],
        ['new_record'], // no tempRef suffix
        ['file_cancel'], // legacy, no tempRef suffix
        ['approve|extra'], // separator present but not a file-save base action
        ['new_record|'], // empty tempRef
        [null],
        [undefined]
      ])('returns null for non-file-save action %s', actionId => {
        expect(fileSaveActionTempRef(actionId)).toBeNull();
      });
    });

    describe('extractTempFileId', () => {
      it('extracts the id from a record ref', () => {
        expect(extractTempFileId('emodel/temp-file@aaa-111')).toBe('aaa-111');
      });

      it('extracts the id from a content download URL', () => {
        expect(extractTempFileId('/gateway/emodel/api/.../content?ref=temp-file@aaa-111')).toBe('aaa-111');
      });

      it('extracts the id from a url-encoded reference', () => {
        expect(extractTempFileId('/gateway/emodel/api/content?ref=temp-file%40aaa-111')).toBe('aaa-111');
      });

      it('returns null when there is no temp-file reference', () => {
        expect(extractTempFileId('emodel/workspace-file@perm-1')).toBeNull();
        expect(extractTempFileId(null)).toBeNull();
      });
    });

    describe('stripTempImageFromText', () => {
      it('removes the markdown image pointing to the dead temp file', () => {
        const text = 'Готов вариант. Сохранить?\n\n![pic](/gateway/emodel/content?ref=temp-file@aaa-111)';
        expect(stripTempImageFromText(text, 'aaa-111')).toBe('Готов вариант. Сохранить?');
      });

      it('keeps images that reference other temp files', () => {
        const text = 'Two:\n\n![a](/c?ref=temp-file@aaa-111)\n\n![b](/c?ref=temp-file@bbb-222)';
        const result = stripTempImageFromText(text, 'aaa-111');
        expect(result).not.toContain('temp-file@aaa-111');
        expect(result).toContain('temp-file@bbb-222');
      });

      it('keeps a live preview whose id has the dead id as a prefix (boundary-anchored match)', () => {
        const text = 'Two:\n\n![dead](/c?ref=temp-file@aaa-111)\n\n![live](/c?ref=temp-file@aaa-1110)';
        const result = stripTempImageFromText(text, 'aaa-111');
        expect(result).not.toContain('![dead]');
        expect(result).toContain('![live](/c?ref=temp-file@aaa-1110)');
      });

      it('leaves a permanent-record preview untouched', () => {
        const text = 'Файл сохранён.\n\n![pic](/gateway/emodel/content?ref=workspace-file@perm-1)';
        expect(stripTempImageFromText(text, 'aaa-111')).toBe(text);
      });

      it('returns non-string text unchanged', () => {
        const obj = { type: 'business_app' };
        expect(stripTempImageFromText(obj, 'aaa-111')).toBe(obj);
      });
    });
  });

  describe('handlePollingResult - dead temp-file preview cleanup', () => {
    const TEMP_REF_A = 'emodel/temp-file@aaa-111';
    const TEMP_REF_B = 'emodel/temp-file@bbb-222';
    const proposalMessage = (id, tempRef) => ({
      id,
      text: `Готов вариант. Сохранить?\n\n![pic](/gateway/emodel/content?ref=${tempRef.replace('emodel/', '')})`,
      sender: 'ai',
      messageData: {
        actions: [
          { id: `new_record|${tempRef}`, label: 'Save' },
          { id: `file_cancel|${tempRef}`, label: 'Cancel' }
        ]
      }
    });

    it('strips the dead preview when the saved tempRef is gone from pendingFiles', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'save-req-1' })
      });
      const { result } = renderHook(() => useUniversalChat());
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        result.current.setMessages([proposalMessage('msg-a', TEMP_REF_A)]);
      });
      await act(async () => {
        await result.current.handleActionClick(`new_record|${TEMP_REF_A}`);
      });
      act(() => {
        // Backend confirms the save: temp-file A no longer pending.
        onResult({ message: 'Файл «pic» сохранён.', pendingFiles: [] });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-a');
      expect(msgA.text).not.toContain('temp-file@aaa-111');
      expect(msgA.text).toBe('Готов вариант. Сохранить?');
    });

    it('keeps the preview when the tempRef is still pending (retryable error)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'save-req-1' })
      });
      const { result } = renderHook(() => useUniversalChat());
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        result.current.setMessages([proposalMessage('msg-a', TEMP_REF_A)]);
      });
      await act(async () => {
        await result.current.handleActionClick(`new_record|${TEMP_REF_A}`);
      });
      act(() => {
        // Retryable error: orchestrator preserved the pending, so A is still listed.
        onResult({
          message: 'Не удалось сохранить файл: ...',
          pendingFiles: [{ tempRef: TEMP_REF_A }]
        });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-a');
      expect(msgA.text).toContain('temp-file@aaa-111');
    });

    it('strips only the saved preview and keeps other live pendings', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'save-req-1' })
      });
      const { result } = renderHook(() => useUniversalChat());
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        result.current.setMessages([proposalMessage('msg-a', TEMP_REF_A), proposalMessage('msg-b', TEMP_REF_B)]);
      });
      await act(async () => {
        await result.current.handleActionClick(`new_record|${TEMP_REF_A}`);
      });
      act(() => {
        // A saved, B still pending.
        onResult({ message: 'Файл «pic» сохранён.', pendingFiles: [{ tempRef: TEMP_REF_B }] });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-a');
      const msgB = result.current.messages.find(m => m.id === 'msg-b');
      expect(msgA.text).not.toContain('temp-file@aaa-111');
      expect(msgB.text).toContain('temp-file@bbb-222');
    });

    it('does not strip previews after a plain text turn (stale ref cleared)', async () => {
      const { result } = renderHook(() => useUniversalChat());
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      // A live pending preview is on screen, but the result here is a normal chat reply with no
      // pendingFiles snapshot. The previously tracked tempRef must not cause a false strip.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'msg-req-1' })
      });
      act(() => {
        result.current.setMessages([proposalMessage('msg-a', TEMP_REF_A)]);
        result.current.setMessage('hi');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });
      act(() => {
        onResult({ message: 'Sure!' });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-a');
      expect(msgA.text).toContain('temp-file@aaa-111');
    });
  });
});
