import { renderHook, act } from '@testing-library/react';

import { MESSAGE_TYPES } from '../constants';
import usePolling from '../hooks/usePolling';
import useUniversalChat, { fileSaveActionTempRef, extractTempFileId, stripTempImageFromText } from '../hooks/useUniversalChat';
import { AGENT_STATUSES } from '../types';
import { isGateStale } from '../utils';

// Only generateUUID is stubbed — the hook also relies on the real `fileSaveActionTempRef`.
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
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

// The hook persists `conversationId` + `requestId` to sessionStorage on every successful submit and
// reads it back in a `useState` initializer. jsdom keeps one storage for the whole file, so without
// this a test would silently inherit the conversation of whichever test ran before it.
beforeEach(() => {
  sessionStorage.clear();
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

    it('retires the buttons of a pending the live snapshot no longer lists', async () => {
      // The backend removes pendings on paths that involve no click on that pair (another pending
      // expired, was cancelled in a second tab). `pendingFiles` is its authoritative live list, so
      // whatever it omits must stop being clickable.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-prune' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-file-a',
            text: 'File A ready ![a](/gateway/content?ref=temp-file@A)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          },
          {
            id: 'msg-file-b',
            text: 'File B ready ![b](/gateway/content?ref=temp-file@B)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@B', label: 'Save B' },
                { id: 'file_cancel|temp-file@B', label: 'Cancel B' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-file-a' });
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        // A was just saved and B is gone too — only what the snapshot lists is still alive.
        onResult({ message: 'Файл сохранён', pendingFiles: [] });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-file-a');
      const msgB = result.current.messages.find(m => m.id === 'msg-file-b');
      expect(msgA.messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
      expect(msgB.messageData.resolvedFileTempRefs).toEqual(['temp-file@B']);
      // Both previews now point at deleted temp files, so neither may stay in the history.
      expect(msgA.text).not.toContain('temp-file@A');
      expect(msgB.text).not.toContain('temp-file@B');
    });

    it('keeps the buttons of a pending the live snapshot still lists', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-keep' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-file-a',
            text: 'File A ready',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          },
          {
            id: 'msg-file-b',
            text: 'File B ready ![b](/gateway/content?ref=temp-file@B)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@B', label: 'Save B' },
                { id: 'file_cancel|temp-file@B', label: 'Cancel B' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-file-a' });
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ message: 'Файл сохранён', pendingFiles: [{ tempRef: 'temp-file@B' }] });
      });

      const msgB = result.current.messages.find(m => m.id === 'msg-file-b');
      expect(msgB.messageData.resolvedFileTempRefs).toBeUndefined();
      expect(msgB.text).toContain('temp-file@B');
    });

    it('keeps the gate of a mixed set live after its file half is answered', async () => {
      // `enrichWithPendingFile` merges the Save/Cancel pair of a file proposed in the same turn onto
      // the gate's own actions. Saving the file short-circuits on the backend before the request
      // reaches the agent, so the plan approval it is still waiting for must keep its buttons —
      // otherwise the only way left to answer the gate is free text.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-mixed-file' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-mixed',
            text: 'План готов. Ещё файл ![a](/gateway/content?ref=temp-file@A)',
            messageData: {
              actions: [
                { id: 'CONFIRM', label: 'Подтвердить' },
                { id: 'REJECT', label: 'Отклонить' },
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-mixed' });
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ message: 'Файл сохранён' });
      });

      const messages = result.current.messages;
      expect(messages[messages.length - 1].isFileActionNotice).toBe(true);
      expect(isGateStale(messages, 0)).toBe(false);
      expect(messages[0].messageData.actionsResolved).toBeUndefined();
      // The file itself is answered, so only its own pair is retired.
      expect(messages[0].messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
    });

    it('strips the dead preview from messageData.message as well as from text', async () => {
      // `createAIMessage` puts the same body into `text` and `messageData.message` for agent cards,
      // and the cards render the messageData copy first (`AgentPlanMessage`:
      // `messageData.message || text`, `BusinessAppMessage`: `detailedStatus || text ||
      // messageData.message`). Cleaning only `text` would leave the <img src> of a deleted temp
      // file on screen — and for the business-app card an emptied `text` falls through to the
      // un-stripped copy, so the strip would put the broken preview back.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-both-copies' })
      });

      const { result } = renderHook(() => useUniversalChat());

      const body = 'Готов вариант ![a](/gateway/content?ref=temp-file@A)';

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-plan-file',
            text: body,
            isAgentPlanContent: true,
            messageData: {
              agentStatus: 'WAITING_PLAN_APPROVAL',
              message: body,
              actions: [
                { id: 'CONFIRM', label: 'Подтвердить' },
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-plan-file' });
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ message: 'Файл сохранён', pendingFiles: [] });
      });

      const saved = result.current.messages.find(msg => msg.id === 'msg-plan-file');
      expect(saved.text).not.toContain('temp-file@A');
      expect(saved.messageData.message).not.toContain('temp-file@A');
      // The prose around the preview survives in both copies — only the image markdown goes.
      expect(saved.messageData.message).toContain('Готов вариант');
      // The gate itself was never answered, so it keeps its own button.
      expect(saved.messageData.actionsResolved).toBeUndefined();
    });

    it('keeps agentStatus when the result only answers a file action', async () => {
      // A file answer carries no agentStatus because it never asked the agent anything; clearing
      // the indicator would claim the agent stopped waiting for the gate that is still live.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-status' })
      });

      const { result } = renderHook(() => useUniversalChat());
      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL, message: 'План готов' });
      });
      expect(result.current.agentStatus).toBe(AGENT_STATUSES.WAITING_PLAN_APPROVAL);

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-any' });
      });

      act(() => {
        onResult({ message: 'Файл сохранён' });
      });

      expect(result.current.agentStatus).toBe(AGENT_STATUSES.WAITING_PLAN_APPROVAL);
    });

    it('prunes nothing when the result carries no file information at all', () => {
      // An ordinary reply has no `pendingFiles` because it never touched a file — reading its
      // absence as "everything is dead" would kill the buttons of a file still awaiting a decision.
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-file-a',
            text: 'File A ready ![a](/gateway/content?ref=temp-file@A)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          }
        ]);
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ message: 'Просто ответ' });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-file-a');
      expect(msgA.messageData.resolvedFileTempRefs).toBeUndefined();
      expect(msgA.text).toContain('temp-file@A');
    });

    it('retires only the answered file when a file result carries no snapshot', async () => {
      // The older backend omitted `pendingFiles` from the answer to a file click. Such an answer
      // still decides the file it answered, but it states nothing about the others: sweeping the
      // history against an empty live set would retire the buttons of every other pending and strip
      // its preview, leaving a file that is very much alive with no way to be saved.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-no-snapshot' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-file-a',
            text: 'File A ![a](/gateway/content?ref=temp-file@A)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          },
          {
            id: 'msg-file-b',
            text: 'File B ![b](/gateway/content?ref=temp-file@B)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@B', label: 'Save B' },
                { id: 'file_cancel|temp-file@B', label: 'Cancel B' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-file-a' });
      });

      const onResult2 = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult2({ message: 'Файл A сохранён' });
      });

      const savedA = result.current.messages.find(m => m.id === 'msg-file-a');
      const savedB = result.current.messages.find(m => m.id === 'msg-file-b');
      // The answered file is decided even without a snapshot: its pair is retired and the preview
      // of the temp file the backend has just consumed is stripped.
      expect(savedA.messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
      expect(savedA.text).not.toContain('temp-file@A');
      // The untouched file is left exactly as it was.
      expect(savedB.messageData.resolvedFileTempRefs).toBeUndefined();
      expect(savedB.text).toContain('temp-file@B');
    });

    it('prunes by a non-empty snapshot even when no file action was clicked', () => {
      // The other half of the trust rule: a turn that answered no file action at all still carries
      // the full live set whenever the backend sends one. Everything it omits is gone server-side
      // (discarded in the same turn, evicted by TTL), so the whole history is pruned against it —
      // this is the only path that retires buttons without a preceding `handleActionClick`.
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-file-a',
            text: 'File A ready ![a](/gateway/content?ref=temp-file@A)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          },
          {
            id: 'msg-file-b',
            text: 'File B ready ![b](/gateway/content?ref=temp-file@B)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@B', label: 'Save B' },
                { id: 'file_cancel|temp-file@B', label: 'Cancel B' }
              ]
            }
          }
        ]);
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        // Only B survived the turn, and nothing was clicked to make it survive.
        onResult({ message: 'Файл A больше не нужен', pendingFiles: [{ tempRef: 'temp-file@B' }] });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-file-a');
      const msgB = result.current.messages.find(m => m.id === 'msg-file-b');
      expect(msgA.messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
      expect(msgA.text).not.toContain('temp-file@A');
      expect(msgB.messageData.resolvedFileTempRefs).toBeUndefined();
      expect(msgB.text).toContain('temp-file@B');
    });

    it('retires every pending on an empty snapshot without a file click', () => {
      // `[]` is the backend saying "no proposal is left" — `AgentOrchestratorService.processRequest`
      // stamps the snapshot on every response, so an empty list is a statement, not silence. This is
      // how the proposals that die without their own button click are retired: a free-text refusal
      // routed to `discardPendingFile`, a legacy tempRef-less `file_cancel`, expiry by the cleanup
      // scheduler. Left live, their buttons would post an action for a deleted tempRef and the
      // preview <img src> behind them would 500.
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-file-a',
            text: 'File A ready ![a](/gateway/content?ref=temp-file@A)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          }
        ]);
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ message: 'Хорошо, забудем про файл', pendingFiles: [] });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-file-a');
      expect(msgA.messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
      expect(msgA.text).not.toContain('temp-file@A');
    });

    it('retires the older copy of a pair the new message re-offers', async () => {
      // A retryable save error makes the backend re-emit the Save/Cancel pair of EVERY surviving
      // pending, not just the one that failed (`enrichWithPendingFile` with an empty
      // `previousTempRefs`). Without retiring the older copies, file B — untouched by the click —
      // would be offered live twice at once, on the original message and on the new one.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-reoffer' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-files',
            text: 'Files ready',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' },
                { id: 'new_record|temp-file@B', label: 'Save B' },
                { id: 'file_cancel|temp-file@B', label: 'Cancel B' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-files' });
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({
          message: 'Не удалось сохранить файл: ...',
          pendingFiles: [{ tempRef: 'temp-file@A' }, { tempRef: 'temp-file@B' }],
          actions: [
            { id: 'new_record|temp-file@A', label: 'Save A' },
            { id: 'file_cancel|temp-file@A', label: 'Cancel A' },
            { id: 'new_record|temp-file@B', label: 'Save B' },
            { id: 'file_cancel|temp-file@B', label: 'Cancel B' }
          ]
        });
      });

      const original = result.current.messages.find(m => m.id === 'msg-files');
      const reoffer = result.current.messages[result.current.messages.length - 1];
      // A was retired by the click itself, B by the newer offer superseding it.
      expect(original.messageData.resolvedFileTempRefs).toEqual(['temp-file@A', 'temp-file@B']);
      // The new message carries the only live copy of both pairs.
      expect(reoffer.messageData.resolvedFileTempRefs).toBeUndefined();
    });

    it('keeps other messages untouched when the new message offers no file actions', () => {
      // Guards the re-offer rule against over-reach: an ordinary reply must not retire anything.
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-file-a',
            text: 'File A ready ![a](/gateway/content?ref=temp-file@A)',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          }
        ]);
      });

      const onResult = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onResult;

      act(() => {
        onResult({ message: 'Ответ с кнопками гейта', actions: [{ id: 'CONFIRM', label: 'Подтвердить' }] });
      });

      const msgA = result.current.messages.find(m => m.id === 'msg-file-a');
      expect(msgA.messageData.resolvedFileTempRefs).toBeUndefined();
      expect(msgA.text).toContain('temp-file@A');
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

    // D-B-7: the service keeps requests in memory, so a restart makes every poll answer 404. The
    // user was shown "Ошибка: Error: 404", which explains nothing they can act on.
    it('explains a lost request instead of printing the transport error', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([{ id: '1', text: 'Processing...', isProcessing: true }]);
      });

      const onError = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onError;

      act(() => {
        onError('whatever the transport said', { requestLost: true });
      });

      expect(result.current.messages[0].text).toBe('ai-assistant.chat.request-lost');
      expect(result.current.messages[0].isError).toBe(true);
      expect(result.current.messages[0].isProcessing).toBe(false);
    });

    // D-B-7: progress cards render from messageData, never from text — without stamping the failure
    // there the card kept showing "Обработка 5 %" with a filled bar for a request that was dead.
    it('stops a progress card from advertising progress after a failure', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: '1',
            isProcessing: true,
            isBusinessAppContent: true,
            messageData: {
              type: MESSAGE_TYPES.BUSINESS_APP_GENERATION,
              stage: 'ANALYSIS',
              progress: 5,
              detailedStatus: 'Анализирую запрос…',
              stageMetadata: { label: 'Обработка', icon: 'fa-cog', animated: true }
            }
          }
        ]);
      });

      const onError = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onError;

      act(() => {
        onError('boom');
      });

      const { messageData } = result.current.messages[0];
      expect(messageData.error).toBe(true);
      // BusinessAppMessage prefers detailedStatus over text, so a stale one would hide the error
      expect(messageData.detailedStatus).toBeNull();
      expect(messageData.stageMetadata.severity).toBe('ERROR');
      expect(messageData.stageMetadata.animated).toBe(false);
      expect(messageData.stageMetadata.label).toBe('ai-assistant.chat.request-failed');
    });

    it('clears the stepper and the agent indicator, which announced a dead request', () => {
      const { result } = renderHook(() => useUniversalChat());

      const onProgress = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onProgress;
      const onError = usePolling.mock.calls[usePolling.mock.calls.length - 1][0].onError;

      act(() => {
        result.current.setMessages([{ id: '1', isProcessing: true }]);
        onProgress({ stage: 'ANALYSIS', progress: 5 });
      });

      expect(result.current.activeBusinessAppProgress).not.toBeNull();

      act(() => {
        onError('boom');
      });

      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.agentStatus).toBeNull();
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

    // D-B-DEPLOY-DBLCLICK (regr-20260816-r1, B4): the buttons are locked through state, which only
    // reaches the DOM on the next render, so two clicks in one render cycle left as two requests.
    // The artifact was deployed exactly once — the backend refuses the second — but its refusal,
    // «Нет активного развёртывания, ожидающего подтверждения», replaced the success message, so the
    // user was told the deploy had not happened.
    it('sends exactly one request for two clicks in the same render cycle', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-1' })
      });

      const { result } = renderHook(() => useUniversalChat());

      await act(async () => {
        // Not awaited one after the other: both clicks are dispatched before either returns, which
        // is what a double click on the same button does.
        await Promise.all([result.current.handleActionClick('deploy_confirm'), result.current.handleActionClick('deploy_confirm')]);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(mockStartPolling).toHaveBeenCalledTimes(1);
    });

    it('stays clickable after a refused action, so it can be retried', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('network down'))
        .mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({ requestId: 'action-req-2' })
        });

      const { result } = renderHook(() => useUniversalChat());

      await act(async () => {
        await result.current.handleActionClick('deploy_confirm');
      });
      await act(async () => {
        await result.current.handleActionClick('deploy_confirm');
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockStartPolling).toHaveBeenCalledWith('action-req-2');
    });

    it('marks the clicked message as resolved and keeps its actions for the disabled render', async () => {
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
      // The gate is closed by a flag, not by dropping the buttons — history keeps the offer
      expect(msgs[0].messageData.actionsResolved).toBe(true);
      expect(msgs[0].messageData.actions).toEqual([{ id: 'approve', label: 'Approve' }]);
      // Nothing deploy-specific was sent, so nothing deploy-specific is recorded.
      expect(msgs[0].messageData.sentDeployScope).toBeUndefined();
    });

    it('records on the message the deploy scope that was actually sent', async () => {
      // `DeployConfirmation` is unmounted whenever the chat window is minimized, so the scope a
      // resolved card reports has to live on the message rather than in the component.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-scope' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-deploy',
            text: 'Развернуть?',
            messageData: { actions: [{ id: 'deploy_confirm', label: 'Развернуть' }] }
          }
        ]);
      });

      const deployScopeOption = { kind: 'WORKSPACE', workspaceId: 'ws-7', label: 'В рабочем пространстве X' };

      await act(async () => {
        await result.current.handleActionClick('deploy_confirm', {
          messageId: 'msg-deploy',
          deployScope: { kind: 'WORKSPACE', workspaceId: 'ws-7' },
          deployScopeOption
        });
      });

      const msg = result.current.messages.find(m => m.id === 'msg-deploy');
      expect(msg.messageData.actionsResolved).toBe(true);
      expect(msg.messageData.sentDeployScope).toEqual(deployScopeOption);

      // The label-carrying option is UI bookkeeping and must not leak into the request payload.
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.deployScope).toEqual({ kind: 'WORKSPACE', workspaceId: 'ws-7' });
      expect(body.deployScopeOption).toBeUndefined();
    });

    it('resolves only the message whose action was clicked', async () => {
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
      // msg-a was the source of the click → the answered tempRef is recorded (buttons stay,
      // rendered disabled). The gate flag is NOT set: a file-save click decides a file, not a gate.
      const msgA = msgs.find(m => m.id === 'msg-a');
      expect(msgA.messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
      expect(msgA.messageData.actionsResolved).toBeUndefined();
      expect(msgA.messageData.actions).toEqual([
        { id: 'new_record|temp-file@A', label: 'Save' },
        { id: 'file_cancel|temp-file@A', label: 'Cancel' }
      ]);
      // msg-b owns a different pending → it stays live
      const msgB = msgs.find(m => m.id === 'msg-b');
      expect(msgB.messageData.resolvedFileTempRefs).toBeUndefined();
      expect(msgB.messageData.actionsResolved).toBeUndefined();
      expect(msgB.messageData.actions).toEqual([
        { id: 'new_record|temp-file@B', label: 'Save' },
        { id: 'file_cancel|temp-file@B', label: 'Cancel' }
      ]);
    });

    it('records one tempRef per click when a message carries two pending files', async () => {
      // The backend emits a Save/Cancel pair per NEW pending, so a single turn that produced two
      // files puts both pairs on one message. Answering the first must retire only its own pair.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-2b' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-two-files',
            text: 'Both files are ready',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' },
                { id: 'new_record|temp-file@B', label: 'Save B' },
                { id: 'file_cancel|temp-file@B', label: 'Cancel B' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-two-files' });
      });
      await act(async () => {
        await result.current.handleActionClick('file_cancel|temp-file@B', { messageId: 'msg-two-files' });
      });

      const msg = result.current.messages.find(m => m.id === 'msg-two-files');
      expect(msg.messageData.resolvedFileTempRefs).toEqual(['temp-file@A', 'temp-file@B']);
      expect(msg.messageData.actionsResolved).toBeUndefined();
    });

    it('retires every copy of the answered pair when the backend re-emitted it', async () => {
      // A retryable save error makes `enrichWithPendingFile` re-attach the Save/Cancel pair of every
      // surviving pending to the new message, so the same tempRef can be offered twice at once.
      // Answering it must retire both copies — a tempRef belongs to the conversation, not to one
      // message — otherwise the leftover copy posts an action for an already decided file.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-dup' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-original',
            text: 'File A ready',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          },
          {
            id: 'msg-retry',
            text: 'Не удалось сохранить файл',
            messageData: {
              actions: [
                { id: 'new_record|temp-file@A', label: 'Save A' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel A' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('file_cancel|temp-file@A', { messageId: 'msg-retry' });
      });

      const msgs = result.current.messages;
      expect(msgs.find(m => m.id === 'msg-retry').messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
      expect(msgs.find(m => m.id === 'msg-original').messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
    });

    it('leaves the gate half of a mixed set unresolved when the file half is answered', async () => {
      // `enrichWithPendingFile` merges the file pair onto the gate of the same turn. Saving the
      // file must not silently answer the CONFIRM/REJECT question the user has not touched.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-2c' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-mixed',
            text: 'Plan ready, file ready',
            messageData: {
              actions: [
                { id: 'CONFIRM', label: 'Confirm' },
                { id: 'REJECT', label: 'Reject' },
                { id: 'new_record|temp-file@A', label: 'Save' },
                { id: 'file_cancel|temp-file@A', label: 'Cancel' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-mixed' });
      });

      const msg = result.current.messages.find(m => m.id === 'msg-mixed');
      expect(msg.messageData.resolvedFileTempRefs).toEqual(['temp-file@A']);
      expect(msg.messageData.actionsResolved).toBeUndefined();
    });

    it('stamps the progress card of a file-save click as a file notice', async () => {
      // The progress card sits in the list for the whole round trip. Counting it as a step of the
      // dialog would make the gate merged into the same mixed set stale until the answer arrives —
      // the plan hint would blink away and a deploy card would revert to reporting a decision it
      // has not taken. The answer that replaces it carries the same flag.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-progress-notice' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'msg-mixed-progress',
            text: 'План готов',
            messageData: {
              actions: [
                { id: 'CONFIRM', label: 'Подтвердить' },
                { id: 'REJECT', label: 'Отклонить' },
                { id: 'new_record|temp-file@A', label: 'Save A' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A', { messageId: 'msg-mixed-progress' });
      });

      const messages = result.current.messages;
      const processing = messages[messages.length - 1];
      expect(processing.isProcessing).toBe(true);
      expect(processing.isFileActionNotice).toBe(true);
      expect(isGateStale(messages, 0)).toBe(false);
    });

    it('leaves the progress card of a dialog action as a step of the dialog', async () => {
      // The counterpart: answering the gate itself does move the dialog on, so its progress card
      // must not carry the exemption.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-progress-gate' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          { id: 'msg-gate', text: 'План готов', messageData: { actions: [{ id: 'CONFIRM', label: 'Подтвердить' }] } }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('CONFIRM', { messageId: 'msg-gate' });
      });

      const processing = result.current.messages[result.current.messages.length - 1];
      expect(processing.isProcessing).toBe(true);
      expect(processing.isFileActionNotice).toBeUndefined();
    });

    it('resolves only the message identified by messageId when action ids repeat', async () => {
      // Escalation buttons reuse the stable CONFIRM/REJECT ids of the gate they replace, so the
      // clicked message can only be told apart by its id — a neighbour awaiting its own decision
      // must keep its buttons live.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'action-req-3' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'gate-1',
            text: 'Deploy the first app?',
            messageData: { actions: [{ id: 'deploy_confirm', label: 'Deploy' }] }
          },
          {
            id: 'gate-2',
            text: 'Deploy the second app?',
            messageData: { actions: [{ id: 'deploy_confirm', label: 'Deploy' }] }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('deploy_confirm', { messageId: 'gate-2' });
      });

      const msgs = result.current.messages;
      expect(msgs.find(m => m.id === 'gate-2').messageData.actionsResolved).toBe(true);
      expect(msgs.find(m => m.id === 'gate-1').messageData.actionsResolved).toBeUndefined();
      expect(msgs.find(m => m.id === 'gate-1').messageData.actions).toEqual([{ id: 'deploy_confirm', label: 'Deploy' }]);
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

    it('keeps the gate live when the action request fails, so it can be retried', async () => {
      // Negative branch: the flag is written only after a successful server answer. A network
      // error must leave the buttons clickable — otherwise the dialog dead-ends on one flaky POST.
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([
          {
            id: 'gate-1',
            text: 'Plan ready',
            messageData: {
              agentStatus: 'WAITING_PLAN_APPROVAL',
              actions: [
                { id: 'CONFIRM', label: 'Confirm' },
                { id: 'REJECT', label: 'Reject' }
              ]
            }
          }
        ]);
      });

      await act(async () => {
        await result.current.handleActionClick('CONFIRM', { messageId: 'gate-1' });
      });

      const msgs = result.current.messages;
      const gate = msgs.find(m => m.id === 'gate-1');
      expect(gate.messageData.actionsResolved).toBeUndefined();
      expect(gate.messageData.actions).toEqual([
        { id: 'CONFIRM', label: 'Confirm' },
        { id: 'REJECT', label: 'Reject' }
      ]);

      // Keeping the flag unset is not enough on its own: the catch branch appends an error notice
      // after the gate, and a purely positional staleness rule would have rendered the buttons
      // disabled anyway. Assert the rule the list is actually rendered with.
      expect(msgs[msgs.length - 1].isError).toBe(true);
      expect(isGateStale(msgs, msgs.indexOf(gate))).toBe(false);
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

  // The user message is appended before the POST, so a send that fails leaves a message for a turn
  // that never happened. Unflagged it would supersede the gate the user was answering by position
  // alone and kill its buttons for good — the agent is still waiting for that answer.
  describe('handleSubmit - failed send keeps the gate live', () => {
    const gateMessage = {
      id: 'gate-1',
      sender: 'ai',
      text: 'Approve the plan?',
      messageData: { actions: [{ id: 'CONFIRM' }, { id: 'REJECT' }] }
    };

    it('flags the user message when the request never reached the backend', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([gateMessage]);
        result.current.setMessage('no, do it differently');
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });

      const messages = result.current.messages;
      const userMessage = messages.find(msg => msg.sender === 'user');

      expect(userMessage.text).toBe('no, do it differently');
      expect(userMessage.isFailedSend).toBe(true);
      expect(messages[messages.length - 1].isError).toBe(true);
      // The gate the reply was meant to answer is still live, so its buttons stay clickable.
      expect(isGateStale(messages, 0)).toBe(false);
    });

    // D-B-12: the backend states why it refused (409 names the request holding the conversation),
    // and the chat used to replace that with "try again" — advice that cannot help here.
    it('shows the reason the backend refused the request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: jest.fn().mockResolvedValue({ error: 'Диалог занят другим запросом (req-42)' })
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessage('привет');
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });

      const last = result.current.messages[result.current.messages.length - 1];

      expect(last.isError).toBe(true);
      expect(last.text).toBe('Диалог занят другим запросом (req-42)');
    });

    // Refusals with an empty body (403 license, 404 conversation ownership) still have to name the
    // status — the message was being built and then dropped on the floor by the catch.
    it('names the status when the refusal carries no body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: jest.fn().mockRejectedValue(new Error('Unexpected end of JSON input'))
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessage('привет');
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });

      const last = result.current.messages[result.current.messages.length - 1];

      expect(last.isError).toBe(true);
      expect(last.text).toBe('ai-assistant.chat.http-error');
      expect(last.text).not.toBe('ai-assistant.chat.request-error');
    });

    it('keeps the generic advice when the failure carries no backend reason', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessage('привет');
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });

      const last = result.current.messages[result.current.messages.length - 1];

      // A transport error is not the backend's wording — do not show it to the user
      expect(last.text).toBe('ai-assistant.chat.request-error');
    });

    it('leaves the user message unflagged when the request is accepted', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'req-1' })
      });

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([gateMessage]);
        result.current.setMessage('no, do it differently');
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });

      const userMessage = result.current.messages.find(msg => msg.sender === 'user');

      expect(userMessage.isFailedSend).toBeUndefined();
      expect(isGateStale(result.current.messages, 0)).toBe(true);
    });

    it('leaves the user message unflagged when the turn fails after the POST was accepted', async () => {
      // A 2xx without a requestId (or an unparseable body, or a throw out of startPolling) lands in
      // the same catch as a network failure, but the backend already has the message and may apply
      // it. Flagging the send would keep the gate live and invite a second, conflicting answer.
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([gateMessage]);
        result.current.setMessage('no, do it differently');
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });

      const userMessage = result.current.messages.find(msg => msg.sender === 'user');

      expect(userMessage.isFailedSend).toBeUndefined();
      expect(isGateStale(result.current.messages, 0)).toBe(true);
    });
  });

  // Minimizing the chat unmounts the message list, so a deploy card's draft scope has to live on
  // the message — otherwise the selection is reverted to the backend default on restore and the
  // next confirm deploys somewhere the user had explicitly changed away from.
  describe('selectDeployScope', () => {
    const deployMessage = {
      id: 'deploy-1',
      sender: 'ai',
      text: 'Ready to deploy',
      messageData: { pendingDeploy: { changeable: true, targetScope: { kind: 'GLOBAL' } }, actions: [{ id: 'deploy_confirm' }] }
    };

    it('records the chosen scope key on the addressed message only', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([deployMessage, { ...deployMessage, id: 'deploy-2' }]);
      });

      act(() => {
        result.current.selectDeployScope('deploy-1', 'WORKSPACE:ws-7');
      });

      expect(result.current.messages[0].messageData.draftDeployScopeKey).toBe('WORKSPACE:ws-7');
      expect(result.current.messages[0].messageData.pendingDeploy).toEqual(deployMessage.messageData.pendingDeploy);
      expect(result.current.messages[1].messageData.draftDeployScopeKey).toBeUndefined();
    });

    it('overwrites an earlier draft when the user picks again', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        result.current.setMessages([deployMessage]);
      });

      act(() => {
        result.current.selectDeployScope('deploy-1', 'WORKSPACE:ws-7');
      });
      act(() => {
        result.current.selectDeployScope('deploy-1', 'GLOBAL:');
      });

      expect(result.current.messages[0].messageData.draftDeployScopeKey).toBe('GLOBAL:');
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
