import Records from '@citeck/records-core';
import { renderHook, act } from '@testing-library/react';

import editorContextService from '../EditorContextService';
import { CHAT_SESSION_STORAGE_KEY } from '../chatSessionStorage';
import usePolling from '../hooks/usePolling';
import useUniversalChat from '../hooks/useUniversalChat';
import { AGENT_STATUSES } from '../types';

import { t } from '@/helpers/export/util';
import { NotificationManager } from '@/services/notifications';

// Mock dependencies
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

jest.mock('../hooks/usePolling', () => {
  return jest.fn(() => ({
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
    activeRequestId: null
  }));
});

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// The hook persists `conversationId` + `requestId` to sessionStorage on every successful submit and
// reads it back in a `useState` initializer. jsdom keeps one storage for the whole file, so without
// this a suite would silently inherit the conversation of whichever test ran before it.
beforeEach(() => {
  sessionStorage.clear();
});

// The artifacts have one writer — the answer the backend polls back — so the tests stage them the
// way production does, through the polling callback the hook handed to `usePolling`. There is no
// raw setter to reach for: the hook exposes the *computed* view only (D-405-1, решение 8).
const lastPollingCallbacks = () => usePolling.mock.calls[usePolling.mock.calls.length - 1][0];

const deliverArtifacts = (artifacts, message = 'ok') => lastPollingCallbacks().onResult({ message, contextArtifacts: artifacts });

describe('useUniversalChat - autoContextArtifacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('initializes autoContextArtifacts as empty array', () => {
    const { result } = renderHook(() => useUniversalChat());
    expect(result.current.autoContextArtifacts).toEqual([]);
  });

  it('stores the artifacts the answer delivered', () => {
    const { result } = renderHook(() => useUniversalChat());

    const artifacts = [{ ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }];

    act(() => {
      deliverArtifacts(artifacts);
    });

    expect(result.current.autoContextArtifacts).toEqual(artifacts);
  });

  it('removeAutoContextArtifact removes artifact by ref', () => {
    const { result } = renderHook(() => useUniversalChat());

    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
      { ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' },
      { ref: 'eproc/bpmn@process1', displayName: 'Process', type: 'BPMN_PROCESS' }
    ];

    act(() => {
      deliverArtifacts(artifacts);
    });

    act(() => {
      result.current.removeAutoContextArtifact('uiserv/form@employee');
    });

    expect(result.current.autoContextArtifacts).toEqual([
      { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
      { ref: 'eproc/bpmn@process1', displayName: 'Process', type: 'BPMN_PROCESS' }
    ]);
  });

  it('removeAutoContextArtifact does nothing for non-existent ref', () => {
    const { result } = renderHook(() => useUniversalChat());

    const artifacts = [{ ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }];

    act(() => {
      deliverArtifacts(artifacts);
    });

    act(() => {
      result.current.removeAutoContextArtifact('non-existent-ref');
    });

    expect(result.current.autoContextArtifacts).toEqual(artifacts);
  });

  // The caller is not always the artifact's own chip: removing a record from the manual context
  // takes the artifact hidden behind it away too, and there the reference comes from the manual
  // entry — written as its own source wrote it, prefix or no prefix.
  it('removeAutoContextArtifact matches a reference written with another app prefix', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      deliverArtifacts([
        { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
        { ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }
      ]);
    });

    act(() => {
      result.current.removeAutoContextArtifact('type@employee');
    });

    expect(result.current.autoContextArtifacts).toEqual([{ ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }]);
  });

  it('removeAutoContextArtifact keeps the array identity when nothing matched', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      deliverArtifacts([{ ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }]);
    });

    const before = result.current.autoContextArtifacts;

    act(() => {
      result.current.removeAutoContextArtifact('emodel/type@other');
    });

    expect(result.current.autoContextArtifacts).toBe(before);
  });

  it('handleSubmit includes autoContextArtifacts in requestData', async () => {
    const mockResponse = { requestId: 'req-123' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const { result } = renderHook(() => useUniversalChat());

    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
      { ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }
    ];

    act(() => {
      deliverArtifacts(artifacts);
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.context.contextArtifacts).toEqual(artifacts);
  });

  it('handleSubmit does not include contextArtifacts when empty', async () => {
    const mockResponse = { requestId: 'req-123' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.context.contextArtifacts).toBeUndefined();
  });

  it('handleSubmit excludes removed artifacts from request', async () => {
    const mockResponse = { requestId: 'req-123' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const { result } = renderHook(() => useUniversalChat());

    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
      { ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }
    ];

    act(() => {
      deliverArtifacts(artifacts);
    });

    act(() => {
      result.current.removeAutoContextArtifact('uiserv/form@employee');
    });

    act(() => {
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.context.contextArtifacts).toEqual([{ ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }]);
  });

  it('clearConversation resets autoContextArtifacts to empty array', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      deliverArtifacts([{ ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }]);
    });

    expect(result.current.autoContextArtifacts).toHaveLength(1);

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(result.current.autoContextArtifacts).toEqual([]);
  });
});

// D-405-1 (решение 8): the hook exposes a computed view of the auto-context artifacts — the state
// keeps everything the backend sent, the view hides what the manual context already holds. Computed
// and not written into the state, because records enter and leave the manual context by themselves
// when their pages are visited (`syncCurrentRecord`), and a state rewrite would make that visit an
// irreversible loss of the artifact.
describe('useUniversalChat - visible autoContextArtifacts (D-405-1)', () => {
  const context = ({ records = [], documents = [] } = {}) => ({ records, documents, attributes: [] });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // 8
  it('hides an artifact whose record was added to the context manually', () => {
    const { result } = renderHook(() =>
      useUniversalChat({ additionalContext: context({ records: [{ recordRef: 'emodel/type@employee' }] }) })
    );

    act(() => {
      lastPollingCallbacks().onResult({
        message: 'ok',
        contextArtifacts: [
          { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
          { ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }
        ]
      });
    });

    expect(result.current.autoContextArtifacts).toEqual([{ ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }]);
  });

  // 9
  it('returns the very same array when there is no overlap', () => {
    const artifacts = [{ ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }];
    const { result } = renderHook(() =>
      useUniversalChat({ additionalContext: context({ records: [{ recordRef: 'emodel/type@unrelated' }] }) })
    );

    act(() => {
      lastPollingCallbacks().onResult({ message: 'ok', contextArtifacts: artifacts });
    });

    // Same reference, not a fresh equal copy — a new array on every pass would re-render every consumer
    expect(result.current.autoContextArtifacts).toBe(artifacts);
  });

  // 10
  it('compares references ignoring the app prefix', () => {
    const { result } = renderHook(() => useUniversalChat({ additionalContext: context({ records: [{ recordRef: 'contract@1a2b' }] }) }));

    act(() => {
      lastPollingCallbacks().onResult({
        message: 'ok',
        contextArtifacts: [{ ref: 'emodel/contract@1a2b', displayName: 'Contract', type: 'DATA_TYPE' }]
      });
    });

    expect(result.current.autoContextArtifacts).toEqual([]);
  });

  it('does not hide artifacts of a different app with the same local id', () => {
    const artifacts = [{ ref: 'emodel/contract@1a2b', displayName: 'Contract', type: 'DATA_TYPE' }];
    const { result } = renderHook(() =>
      useUniversalChat({ additionalContext: context({ records: [{ recordRef: 'alfresco/contract@1a2b' }] }) })
    );

    act(() => {
      lastPollingCallbacks().onResult({ message: 'ok', contextArtifacts: artifacts });
    });

    expect(result.current.autoContextArtifacts).toEqual(artifacts);
  });

  // 31 — the behaviour a state rewrite could not give: the artifact comes back
  it('shows the artifact again once the manual record has left the context', () => {
    const artifacts = [{ ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }];
    const { result, rerender } = renderHook(({ ctx }) => useUniversalChat({ additionalContext: ctx }), {
      initialProps: { ctx: context({ records: [{ recordRef: 'emodel/type@employee' }] }) }
    });

    act(() => {
      lastPollingCallbacks().onResult({ message: 'ok', contextArtifacts: artifacts });
    });
    expect(result.current.autoContextArtifacts).toEqual([]);

    // The record leaves the manual context — removed by hand or by leaving its page
    rerender({ ctx: context() });

    expect(result.current.autoContextArtifacts).toEqual(artifacts);
  });

  // 33 — the documents branch
  it('hides an artifact matching a manual document and shows it again after its removal', () => {
    const artifacts = [{ ref: 'attachment@doc-1', displayName: 'Договор.pdf', type: 'DOCUMENT' }];
    const { result, rerender } = renderHook(({ ctx }) => useUniversalChat({ additionalContext: ctx }), {
      initialProps: { ctx: context({ documents: [{ recordRef: 'emodel/attachment@doc-1' }] }) }
    });

    act(() => {
      lastPollingCallbacks().onResult({ message: 'ok', contextArtifacts: artifacts });
    });
    expect(result.current.autoContextArtifacts).toEqual([]);

    rerender({ ctx: context() });

    expect(result.current.autoContextArtifacts).toEqual(artifacts);
  });

  // 34 — one entity must not travel through two channels of one request
  it('does not duplicate a manually added entity in contextArtifacts of the request', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-123' })
    });

    const manualRecord = { recordRef: 'emodel/type@employee', displayName: 'Employee', type: 'type' };
    const manualDocument = { recordRef: 'emodel/attachment@doc-1', displayName: 'Договор.pdf' };
    const { result } = renderHook(() =>
      useUniversalChat({ additionalContext: context({ records: [manualRecord], documents: [manualDocument] }) })
    );

    act(() => {
      deliverArtifacts([
        // matches the manual record, written without the app prefix
        { ref: 'type@employee', displayName: 'Employee', type: 'DATA_TYPE' },
        // matches the manual document
        { ref: 'emodel/attachment@doc-1', displayName: 'Договор.pdf', type: 'DOCUMENT' },
        { ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }
      ]);
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    // Both manual entities went out through their own channels…
    expect(requestBody.context.selection.records).toEqual([manualRecord]);
    expect(requestBody.context.selection.documents).toEqual([manualDocument]);
    // …so contextArtifacts carries only what no channel has sent yet
    expect(requestBody.context.contextArtifacts).toEqual([{ ref: 'uiserv/form@employee', displayName: 'Employee Form', type: 'FORM' }]);
  });

  // 34a — the same rule for a record `handleSubmit` adds by itself. With documents picked by hand and
  // no record among them, the parent record of every document is loaded and pushed into
  // `selection.records`; it is in no collection the computed sift can see, so the artifact standing
  // for it would go out alongside — the same entity through two channels of one request.
  it('does not duplicate a document parent record in contextArtifacts of the request', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-123' })
    });
    Records.get.mockReturnValue({ load: jest.fn().mockResolvedValue({ displayName: 'Договор №1', type: 'emodel/type@contract' }) });

    const manualDocument = { recordRef: 'emodel/attachment@doc-1', displayName: 'Договор.pdf', parentRef: 'emodel/contract@1' };
    const { result } = renderHook(() => useUniversalChat({ additionalContext: context({ records: [], documents: [manualDocument] }) }));

    act(() => {
      deliverArtifacts([
        // the parent of the manual document, written the way the backend spells it
        { ref: 'contract@1', displayName: 'Договор №1', type: 'DATA_TYPE' },
        { ref: 'uiserv/form@contract', displayName: 'Contract Form', type: 'FORM' }
      ]);
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    // The parent really is added to the records channel…
    expect(requestBody.context.selection.records).toEqual([
      { recordRef: 'emodel/contract@1', displayName: 'Договор №1', type: 'emodel/type@contract' }
    ]);
    // …so its artifact must not travel next to it
    expect(requestBody.context.contextArtifacts).toEqual([{ ref: 'uiserv/form@contract', displayName: 'Contract Form', type: 'FORM' }]);
  });
});

describe('useUniversalChat - selectedAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // `jest.clearAllMocks()` wipes recorded calls but keeps a `mockReturnValue`, and the editing
  // tests below install one. Restored here rather than at the end of each test body: a test that
  // fails before its last line would otherwise leave every later test in the file running against
  // a script-editing context, turning one failure into a wall of unrelated ones.
  afterEach(() => {
    editorContextService.getContextData.mockReturnValue({});
    editorContextService.getHandler.mockReturnValue(undefined);
  });

  it('initializes selectedAgent as null', () => {
    const { result } = renderHook(() => useUniversalChat());
    expect(result.current.selectedAgent).toBeNull();
  });

  it('setSelectedAgent updates selectedAgent state', () => {
    const { result } = renderHook(() => useUniversalChat());
    const agent = { id: 'agent-1', name: 'Бизнес-аналитик' };

    act(() => {
      result.current.setSelectedAgent(agent);
    });

    expect(result.current.selectedAgent).toEqual(agent);
  });

  it('setSelectedAgent to null clears agent', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setSelectedAgent({ id: 'agent-1', name: 'Agent' });
    });

    act(() => {
      result.current.setSelectedAgent(null);
    });

    expect(result.current.selectedAgent).toBeNull();
  });

  it('handleSubmit includes agentRef in request when agent is selected', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-123' })
    });

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setSelectedAgent({ id: 'business-analyst', name: 'Бизнес-аналитик' });
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.context.agentRef).toBe('emodel/ai-agent@business-analyst');
  });

  it('handleSubmit does not include agentRef when no agent selected', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-123' })
    });

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.context.agentRef).toBeUndefined();
  });

  // FE-M5: script editing routes to the config agent via agentRef instead of forceIntent
  it('handleSubmit routes script editing to the config agent via agentRef and omits forceIntent', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-script' })
    });
    editorContextService.getContextData.mockReturnValue({
      forceIntent: 'script_writing',
      recordRef: 'rec-1',
      scriptContextType: 'computed_attribute'
    });
    editorContextService.getHandler.mockReturnValue(() => 'var x = 1;');

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('optimize this');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.context.agentRef).toBe('emodel/ai-agent@platform-config-agent');
    expect(requestBody.context.forceIntent).toBeUndefined();
    expect(requestBody.context.editing.type).toBe('script');
    expect(requestBody.context.editing.content).toBe('var x = 1;');
  });

  it('handleSubmit keeps forceIntent (no config agentRef) for text editing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-text' })
    });
    editorContextService.getContextData.mockReturnValue({
      forceIntent: 'text_editing',
      recordRef: 'rec-1'
    });
    editorContextService.getHandler.mockReturnValue(() => 'hello');

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('rephrase');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.context.forceIntent).toBe('text_editing');
    expect(requestBody.context.agentRef).toBeUndefined();
    expect(requestBody.context.editing.type).toBe('text');
  });

  it('clearConversation does NOT reset selectedAgent', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useUniversalChat());
    const agent = { id: 'agent-1', name: 'Test Agent' };

    act(() => {
      result.current.setSelectedAgent(agent);
    });

    expect(result.current.selectedAgent).toEqual(agent);

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(result.current.selectedAgent).toEqual(agent);
  });

  it('clearConversation resets agentStatus to null', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(result.current.agentStatus).toBeNull();
  });
});

describe('useUniversalChat - handleActionClick deploy scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-deploy' })
    });
  });

  it('deploy_confirm forwards deployScope in the request payload', async () => {
    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.handleActionClick('deploy_confirm', {
        deployScope: { kind: 'WORKSPACE', workspaceId: 'ws-7' }
      });
    });

    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.action).toBe('deploy_confirm');
    expect(requestBody.deployScope).toEqual({ kind: 'WORKSPACE', workspaceId: 'ws-7' });
  });

  it('omits deployScope for actions without an override (backward compatible)', async () => {
    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.handleActionClick('deploy_reject');
    });

    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.action).toBe('deploy_reject');
    expect(requestBody.deployScope).toBeUndefined();
  });

  it('omits deployScope for a legacy action invoked with no extra arg', async () => {
    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.handleActionClick('main_content');
    });

    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.action).toBe('main_content');
    expect(requestBody.deployScope).toBeUndefined();
  });

  it('resolves only the clicked message when ids are shared (scoped by messageId)', async () => {
    const { result } = renderHook(() => useUniversalChat());

    const deployActions = [{ id: 'deploy_confirm' }, { id: 'deploy_reject' }];
    act(() => {
      result.current.setMessages([
        { id: 'deploy-a', messageData: { actions: deployActions, pendingDeploy: {} } },
        { id: 'deploy-b', messageData: { actions: deployActions, pendingDeploy: {} } }
      ]);
    });

    await act(async () => {
      await result.current.handleActionClick('deploy_confirm', { messageId: 'deploy-b' });
    });

    const byId = Object.fromEntries(result.current.messages.filter(m => m.id).map(m => [m.id, m]));
    expect(byId['deploy-a'].messageData.actions).toEqual(deployActions);
    expect(byId['deploy-a'].messageData.actionsResolved).toBeUndefined();
    // The clicked gate keeps its buttons; the flag is what renders them disabled.
    expect(byId['deploy-b'].messageData.actions).toEqual(deployActions);
    expect(byId['deploy-b'].messageData.actionsResolved).toBe(true);

    // messageId is only a client-side routing hint; it must not leak into the request payload.
    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.messageId).toBeUndefined();
  });
});

describe('useUniversalChat - business-app stepper piggyback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // usePolling is mocked; grab the onProgress/onResult callbacks the hook wired into it.
  const lastPollingCallbacks = () => {
    const calls = usePolling.mock.calls;
    return calls[calls.length - 1][0];
  };

  it('advances the stepper from businessApp on agent_execution progress', () => {
    const { result } = renderHook(() => useUniversalChat());
    const { onProgress } = lastPollingCallbacks();

    act(() => {
      onProgress({
        type: 'agent_execution',
        businessApp: {
          stage: 'GENERATING_FORMS',
          progress: 55,
          availableStages: [{ key: 'ANALYZING_REQUIREMENTS' }, { key: 'GENERATING_FORMS' }]
        }
      });
    });

    expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'GENERATING_FORMS', progress: 55 });
    expect(result.current.generationStages).toEqual([{ key: 'ANALYZING_REQUIREMENTS' }, { key: 'GENERATING_FORMS' }]);
  });

  it('advances the stepper from businessApp on agent_planning progress', () => {
    const { result } = renderHook(() => useUniversalChat());
    const { onProgress } = lastPollingCallbacks();

    act(() => {
      onProgress({
        type: 'agent_planning',
        businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 20 }
      });
    });

    expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'ANALYZING_REQUIREMENTS', progress: 20 });
  });

  // COREDEV-484: the backend appends the stages of the artifact kinds the plan asked for only after
  // the plan is built, so the stepper has to follow the latest list rather than freeze the first one.
  it('replaces generationStages when a later emission carries a different stage list', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      // usePolling always receives the freshest callback on each render, so re-read it per emission.
      lastPollingCallbacks().onProgress({
        type: 'agent_planning',
        businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 0, availableStages: [{ key: 'A' }] }
      });
    });
    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'A' }, { key: 'B' }] }
      });
    });

    expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
  });

  it('keeps the same generationStages reference when the same list arrives again', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 20, availableStages: [{ key: 'A' }, { key: 'B' }] }
      });
    });
    const firstList = result.current.generationStages;
    expect(firstList).toEqual([{ key: 'A' }, { key: 'B' }]);

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        // A fresh array with fresh objects but the same keys — the state must not be touched.
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'A' }, { key: 'B' }] }
      });
    });

    expect(result.current.generationStages).toBe(firstList);
  });

  it('does not drop generationStages when an emission has no availableStages', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 20, availableStages: [{ key: 'A' }] }
      });
    });
    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55 }
      });
    });

    expect(result.current.generationStages).toEqual([{ key: 'A' }]);
    expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'GENERATING_FORMS', progress: 55 });
  });

  it('takes the latest stage list on the non-agent business_app_generation path', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'business_app_generation',
        stage: 'ANALYZING_REQUIREMENTS',
        progress: 10,
        availableStages: [{ key: 'A' }]
      });
    });
    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'business_app_generation',
        stage: 'GENERATING_FORMS',
        progress: 40,
        availableStages: [{ key: 'A' }, { key: 'B' }]
      });
    });

    expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
  });

  it('createAIMessage takes a differing availableStages list from a business-app result', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'A' }] }
      });
    });
    act(() => {
      lastPollingCallbacks().onResult({
        message: {
          type: 'business_app_generation',
          message: 'Готово',
          status: 'IN_PROGRESS',
          availableStages: [{ key: 'A' }, { key: 'B' }]
        }
      });
    });

    expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
  });

  it('createAIMessage keeps the same generationStages reference when a non-terminal result repeats the list', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'A' }, { key: 'B' }] }
      });
    });
    const firstList = result.current.generationStages;

    act(() => {
      lastPollingCallbacks().onResult({
        message: {
          type: 'business_app_generation',
          message: 'Продолжаю',
          status: 'IN_PROGRESS',
          availableStages: [{ key: 'A' }, { key: 'B' }]
        }
      });
    });

    expect(result.current.generationStages).toBe(firstList);
  });

  it('createAIMessage does not drop generationStages when a result carries no availableStages', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'A' }] }
      });
    });
    act(() => {
      lastPollingCallbacks().onResult({
        message: { type: 'business_app_generation', message: 'Готово', status: 'IN_PROGRESS' }
      });
    });

    expect(result.current.generationStages).toEqual([{ key: 'A' }]);
  });

  // The terminal success message carries a plan-derived list that is narrower than the full basis
  // shown during the run (`buildBusinessAppSuccessMessage`); it must not shrink the ribbon for the
  // 5 s it stays after completion.
  it('keeps the stepper of the run when the COMPLETED result carries a narrower stage list', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'A' }, { key: 'B' }, { key: 'C' }] }
      });
    });
    const runList = result.current.generationStages;

    act(() => {
      lastPollingCallbacks().onResult({
        message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100, availableStages: [{ key: 'A' }, { key: 'C' }] }
      });
    });

    expect(result.current.generationStages).toBe(runList);
  });

  it('seeds the stepper from a COMPLETED result when no stage list was received before (reload on the result)', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onResult({
        message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100, availableStages: [{ key: 'A' }, { key: 'C' }] }
      });
    });

    expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'C' }]);
  });

  it('takes the stage list of the initialProgress that answers a new question', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        requestId: 'req-1',
        initialProgress: { type: 'agent_planning', availableStages: [{ key: 'A' }, { key: 'B' }] }
      })
    });
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('сделай приложение');
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
  });

  it('keeps the stage list reference when the initialProgress of a new question repeats it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        requestId: 'req-1',
        initialProgress: { type: 'agent_planning', availableStages: [{ key: 'A' }, { key: 'B' }] }
      })
    });
    const { result } = renderHook(() => useUniversalChat());

    // A list of a previous generation is still in state (within its 5 s cleanup window)
    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'A' }, { key: 'B' }] }
      });
    });
    const previous = result.current.generationStages;

    act(() => {
      result.current.setMessage('ещё раз');
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    expect(result.current.generationStages).toBe(previous);
  });

  it('leaves the stepper untouched for non-business-app agent progress', () => {
    const { result } = renderHook(() => useUniversalChat());
    const { onProgress } = lastPollingCallbacks();

    act(() => {
      onProgress({ type: 'agent_execution', currentStepId: 's1' });
    });

    expect(result.current.activeBusinessAppProgress).toBeNull();
    expect(result.current.generationStages).toBeNull();
  });

  it('clears the stepper 5s after a COMPLETED business-app result', () => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }] }
        });
      });
      expect(result.current.activeBusinessAppProgress).not.toBeNull();

      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });
      // still present right after the result — cleanup is deferred 5s.
      expect(result.current.activeBusinessAppProgress).not.toBeNull();

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('clears the stepper 5s after a COMPLETED error business-app result', () => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }] }
        });
      });

      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', error: true, message: 'Отменено' } });
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  // A generation started inside the 5 s cleanup window of the previous one owns the stepper from
  // the moment it brings its own list: the deferred cleanup of the previous generation must not
  // wipe the new ribbon and list at T+5 s (they used to blink out until the next emission).
  it('does not wipe the stepper of a generation started within the 5 s cleanup window of the previous one', async () => {
    jest.useFakeTimers();
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          requestId: 'req-2',
          initialProgress: { type: 'agent_planning', availableStages: [{ key: 'A' }, { key: 'B' }] }
        })
      });
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.setMessage('ещё одно приложение');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
    } finally {
      jest.useRealTimers();
    }
  });

  // The same rule on the other request-starting path: a plan approval IS the click that starts a
  // business-app generation, and one made inside the window used to have its own ribbon and list
  // wiped at T+5 s by the pending cleanup of the generation before it.
  it('does not wipe the stepper of a generation started by an action click within the cleanup window', async () => {
    jest.useFakeTimers();
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          requestId: 'req-3',
          initialProgress: { type: 'agent_planning', availableStages: [{ key: 'A' }, { key: 'B' }] }
        })
      });
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      await act(async () => {
        await result.current.handleActionClick('plan_approve');
      });
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
      expect(result.current.activeBusinessAppProgress).toBeNull();

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
    } finally {
      jest.useRealTimers();
    }
  });

  // The shape the controller actually returns for a plan approval: `handleActionClick` sends no
  // `forceIntent`, so the snapshot is built from the active agent state and carries no stage list at
  // all. Gating the disarm on `availableStages` made the fix above unreachable in production — the
  // approval kept the previous generation's pending timer, which wiped its ribbon and its stages at
  // T+5 s. The stage list of the previous generation goes with its ribbon, and this turn's own
  // list arrives with its first polled emission.
  it('disarms the pending cleanup on an action-started generation whose snapshot brings no stage list', async () => {
    jest.useFakeTimers();
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          requestId: 'req-4',
          initialProgress: { type: 'agent_planning', progress: 0 }
        })
      });
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }, { key: 'Y' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      await act(async () => {
        await result.current.handleActionClick('plan_approve');
      });
      // The takeover does the whole job the disarmed timer was owed: the previous generation's
      // ribbon AND its stage list go, so this turn cannot render its own percentage against them.
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();

      // What the disarm buys: the list this turn brings itself outlives the moment the timer
      // would have fired.
      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 5, availableStages: [{ key: 'A' }, { key: 'B' }] }
        });
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
    } finally {
      jest.useRealTimers();
    }
  });

  // Disarming the cleanup takes over its other half as well: the ribbon of the previous generation
  // is dropped at submit, so a generation that resolves before its first progress poll (a fast
  // clarification gate) does not sit under the finished timeline of the previous one indefinitely.
  it('drops the previous ribbon when a generation started within the window resolves before its first poll', async () => {
    jest.useFakeTimers();
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          requestId: 'req-2',
          initialProgress: { type: 'agent_planning', availableStages: [{ key: 'A' }, { key: 'B' }] }
        })
      });
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'DEPLOYING', progress: 90, availableStages: [{ key: 'X' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.setMessage('ещё одно приложение');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);

      // The gate answers before any progress emission: no COMPLETED, so no new timer is armed.
      act(() => {
        onResult({ message: { type: 'text', text: 'Уточните, пожалуйста, набор ролей.' } });
      });
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
    } finally {
      jest.useRealTimers();
    }
  });

  // The other side of the same rule: a question that brings no stage list is not a generation, so
  // the previous generation's cleanup still runs at T+5 s and nothing keeps hanging over the chat.
  it('still clears the stepper 5 s after completion when the next question brings no stage list', async () => {
    jest.useFakeTimers();
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: 'req-2' })
      });
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });

      act(() => {
        result.current.setMessage('а что такое тип данных?');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });
      expect(result.current.activeBusinessAppProgress).not.toBeNull();

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  // The same shape on the free-text path: a question asked while a plan is already active comes
  // back as an `agent_planning` snapshot built from the agent state, with no stage list on it. Both
  // request-starting paths follow one rule — the snapshot is what says a turn started — so this one
  // disarms the previous generation's cleanup exactly like the plan-approval click above, and drops
  // its ribbon and stage list in the timer's stead. Gating it on the list left the finished ribbon of
  // the previous generation hanging over the new turn until T+5 s on the path the user reaches most
  // often.
  it('disarms the pending cleanup on a submitted turn whose snapshot brings no stage list', async () => {
    jest.useFakeTimers();
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          requestId: 'req-5',
          initialProgress: { type: 'agent_planning', progress: 0 }
        })
      });
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }, { key: 'Y' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.setMessage('добавь ещё роль администратора');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() });
      });
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();

      // The disarm still holds: the list this turn's first emission brings survives past T+5 s.
      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 5, availableStages: [{ key: 'A' }, { key: 'B' }] }
        });
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
    } finally {
      jest.useRealTimers();
    }
  });

  // The controller seeds `initialProgress` for ANY request sent while an agent state is active, a
  // file-save click included — and that click starts no generation and owns no stepper. Letting the
  // snapshot alone decide disarmed the pending cleanup and dropped the ribbon on its behalf, which
  // left the previous generation's stage list in state with no timer left to take it down.
  it('leaves the pending stepper cleanup armed when a file-save click brings a snapshot', async () => {
    jest.useFakeTimers();
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          requestId: 'req-6',
          initialProgress: { type: 'agent_planning', progress: 0 }
        })
      });
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A');
      });
      expect(result.current.activeBusinessAppProgress).not.toBeNull();

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('disarms the pending stepper cleanup when a live emission arrives within the window', () => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'PLANNING', progress: 5, availableStages: [{ key: 'A' }, { key: 'B' }] }
        });
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'PLANNING', progress: 5 });
      expect(result.current.generationStages).toEqual([{ key: 'A' }, { key: 'B' }]);
    } finally {
      jest.useRealTimers();
    }
  });

  // D-B-7: a failed turn has to leave the same clean slate the success path does. A leftover stage
  // list would be shown for the NEXT, unrelated request until that request emits its own.
  it('clears the stage list along with the stepper when polling fails', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'FIRST' }] }
      });
    });
    expect(result.current.generationStages).toEqual([{ key: 'FIRST' }]);

    act(() => {
      lastPollingCallbacks().onError('boom');
    });

    expect(result.current.activeBusinessAppProgress).toBeNull();
    expect(result.current.generationStages).toBeNull();

    // The next request seeds its own stage list, which the stale one would have blocked
    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 10, availableStages: [{ key: 'SECOND' }] }
      });
    });

    expect(result.current.generationStages).toEqual([{ key: 'SECOND' }]);
  });

  // A cancelled turn is as dead as a failed one. Without this, cancelling a generation that had
  // disarmed the 5 s cleanup (its own list arrived within the window after a COMPLETED result) left
  // the ribbon and the stage list on screen with nobody to take them down.
  it('clears the stepper, the stage list and the pending cleanup when the request is cancelled server-side', () => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useUniversalChat());
      const { onProgress, onResult, onCancelled } = lastPollingCallbacks();

      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'X' }] }
        });
      });
      act(() => {
        onResult({ message: { type: 'business_app_generation', stage: 'COMPLETED', progress: 100 } });
      });
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      // The next generation disarms the cleanup with its own list
      act(() => {
        onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'PLANNING', progress: 5, availableStages: [{ key: 'A' }, { key: 'B' }] }
        });
      });
      act(() => {
        onCancelled();
      });

      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();
      expect(result.current.agentStatus).toBeNull();

      // Nothing is pending any more: a later tick must not throw or resurrect anything
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('clears the stepper and the stage list when the user cancels the request', async () => {
    const defaultPollingMock = () => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: null });
    usePolling.mockImplementation(() => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: 'req-1' }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    try {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        lastPollingCallbacks().onProgress({
          type: 'agent_planning',
          businessApp: { stage: 'PLANNING', progress: 5, availableStages: [{ key: 'A' }] }
        });
      });
      expect(result.current.generationStages).toEqual([{ key: 'A' }]);
      expect(result.current.agentStatus).not.toBeNull();

      await act(async () => {
        await result.current.cancelRequest();
      });

      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toBeNull();
      expect(result.current.agentStatus).toBeNull();
    } finally {
      usePolling.mockImplementation(defaultPollingMock);
    }
  });

  it('keeps the stepper when the server refuses the cancellation', async () => {
    const defaultPollingMock = () => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: null });
    usePolling.mockImplementation(() => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: 'req-1' }));
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    try {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        lastPollingCallbacks().onProgress({
          type: 'agent_execution',
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ key: 'A' }] }
        });
      });

      await act(async () => {
        await result.current.cancelRequest();
      });

      // The request is still running there, so its ribbon stays
      expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'GENERATING_FORMS', progress: 55 });
      expect(result.current.generationStages).toEqual([{ key: 'A' }]);
    } finally {
      usePolling.mockImplementation(defaultPollingMock);
    }
  });

  // A file-save click is answered before the request reaches the agent, so however its turn ends it
  // says nothing about the dialog behind it: the badge and the ribbon belong to a generation that is
  // merely parked on a live gate. Cleared here, they stayed gone until the next turn, while the
  // backend went on waiting. `handlePollingResult` keeps `agentStatus` for the same case.
  describe('a dead file-save turn leaves the agent state alone', () => {
    const seedConversation = () =>
      sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify({ conversationId: 'conv-1', requestId: null, savedAt: Date.now() }));

    // Stages the state a live gate leaves behind, then answers one of its file buttons.
    const clickFileSaveOnALiveGate = async result => {
      act(() => {
        lastPollingCallbacks().onProgress({
          type: 'agent_planning',
          businessApp: { stage: 'PLANNING', progress: 5, availableStages: [{ key: 'A' }] }
        });
      });
      expect(result.current.agentStatus).not.toBeNull();

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-file@A');
      });
    };

    const expectStepperKept = result => {
      expect(result.current.agentStatus).toBe(AGENT_STATUSES.PLANNING);
      expect(result.current.generationStages).toEqual([{ key: 'A' }]);
      expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'PLANNING', progress: 5 });
    };

    it('when the user cancels it', async () => {
      const defaultPollingMock = () => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: null });
      usePolling.mockImplementation(() => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: 'req-file' }));
      seedConversation();
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) });
      try {
        const { result } = renderHook(() => useUniversalChat());
        await clickFileSaveOnALiveGate(result);

        await act(async () => {
          await result.current.cancelRequest();
        });

        expectStepperKept(result);
      } finally {
        usePolling.mockImplementation(defaultPollingMock);
      }
    });

    it('when the backend reports it cancelled', async () => {
      seedConversation();
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) });
      const { result } = renderHook(() => useUniversalChat());
      await clickFileSaveOnALiveGate(result);

      act(() => {
        lastPollingCallbacks().onCancelled();
      });

      expectStepperKept(result);
    });

    it('when it ends in a failure', async () => {
      seedConversation();
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) });
      const { result } = renderHook(() => useUniversalChat());
      await clickFileSaveOnALiveGate(result);

      act(() => {
        lastPollingCallbacks().onError('boom', { requestAlive: false });
      });

      expectStepperKept(result);
    });

    // O-3 (приёмка 2026-09-08): the exemption above must not outlive the turn that earned it. An
    // ordinary answer means the backend routed past the agent, so the snapshot on screen belongs to
    // a run that is over and will never correct itself — otherwise the ribbon a cancelled file turn
    // kept on purpose stayed over every later question with nothing left to remove it. The stage
    // list survives: a generation parked on a clarifying gate answers the same way and resumes.
    it('and the ribbon it kept goes with the badge on the next ordinary answer', async () => {
      seedConversation();
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) });
      const { result } = renderHook(() => useUniversalChat());
      await clickFileSaveOnALiveGate(result);

      act(() => {
        lastPollingCallbacks().onCancelled();
      });
      expectStepperKept(result);

      act(() => {
        lastPollingCallbacks().onResult({ message: 'Отпуск оформляется заявкой.' });
      });

      expect(result.current.agentStatus).toBeNull();
      expect(result.current.activeBusinessAppProgress).toBeNull();
      expect(result.current.generationStages).toEqual([{ key: 'A' }]);
    });

    it('but an answer that keeps the badge keeps the ribbon too', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        lastPollingCallbacks().onProgress({
          type: 'agent_planning',
          businessApp: { stage: 'PLANNING', progress: 5, availableStages: [{ key: 'A' }] }
        });
      });

      act(() => {
        lastPollingCallbacks().onResult({ message: 'Уточните срок согласования', agentStatus: AGENT_STATUSES.WAITING_PLAN_APPROVAL });
      });

      expect(result.current.agentStatus).toBe(AGENT_STATUSES.WAITING_PLAN_APPROVAL);
      expect(result.current.generationStages).toEqual([{ key: 'A' }]);
      expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'PLANNING', progress: 5 });
    });

    // A clarifying gate of the generation itself: the run is alive and waiting to be told what to
    // do, so its ribbon stays even though the answer carries no `agentStatus`.
    it('and a non-terminal business-app answer keeps the ribbon', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        lastPollingCallbacks().onProgress({
          type: 'agent_planning',
          businessApp: { stage: 'PLANNING', progress: 5, availableStages: [{ key: 'A' }] }
        });
      });

      act(() => {
        lastPollingCallbacks().onResult({
          message: { type: 'business_app_generation', stage: 'CLARIFYING_QUESTIONS', message: 'Сколько уровней согласования?' }
        });
      });

      expect(result.current.generationStages).toEqual([{ key: 'A' }]);
      expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'PLANNING', progress: 5 });
    });

    // The guard is scoped to the file turn: an ordinary turn dying next to the same gate still takes
    // the stepper down, exactly as before.
    it('but an ordinary cancelled turn still clears it', () => {
      const { result } = renderHook(() => useUniversalChat());

      act(() => {
        lastPollingCallbacks().onProgress({
          type: 'agent_planning',
          businessApp: { stage: 'PLANNING', progress: 5, availableStages: [{ key: 'A' }] }
        });
      });

      act(() => {
        lastPollingCallbacks().onCancelled();
      });

      expect(result.current.agentStatus).toBeNull();
      expect(result.current.generationStages).toBeNull();
      expect(result.current.activeBusinessAppProgress).toBeNull();
    });
  });
});

// O-2 (приёмка 2026-09-08): `handleActionClick` retires the Save/Cancel pair of the clicked file
// the moment it is clicked, before the answer is known. A turn that ends without deciding the file
// has to give the pair back, or the file can be neither saved nor dismissed for the rest of the
// conversation — the same rule `isGateStale` already follows for ordinary gates.
describe('useUniversalChat - a dead file turn gives its buttons back', () => {
  const FILE_ACTIONS = [
    { id: 'new_record|temp-1', label: 'Сохранить' },
    { id: 'file_cancel|temp-1', label: 'Отмена' }
  ];

  const resolvedRefs = result => {
    const gate = result.current.messages.find(msg => msg.messageData?.actions === FILE_ACTIONS);
    return gate?.messageData?.resolvedFileTempRefs || [];
  };

  const offerTheFile = result =>
    act(() => {
      lastPollingCallbacks().onResult({
        message: 'Подготовил файл. Сохранить?',
        actions: FILE_ACTIONS,
        pendingFiles: [{ tempRef: 'temp-1' }]
      });
    });

  beforeEach(() => {
    sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify({ conversationId: 'conv-1', requestId: null, savedAt: Date.now() }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) });
  });

  it('retires the pair on the click and restores it when the poll fails', async () => {
    const { result } = renderHook(() => useUniversalChat());
    offerTheFile(result);

    await act(async () => {
      await result.current.handleActionClick('new_record|temp-1');
    });
    expect(resolvedRefs(result)).toEqual(['temp-1']);

    act(() => {
      lastPollingCallbacks().onError('boom', { requestAlive: false });
    });

    expect(resolvedRefs(result)).toEqual([]);
  });

  it('restores it when the backend reports the turn cancelled', async () => {
    const { result } = renderHook(() => useUniversalChat());
    offerTheFile(result);

    await act(async () => {
      await result.current.handleActionClick('file_cancel|temp-1');
    });
    expect(resolvedRefs(result)).toEqual(['temp-1']);

    act(() => {
      lastPollingCallbacks().onCancelled();
    });

    expect(resolvedRefs(result)).toEqual([]);
  });

  it('restores it when the user cancels the turn', async () => {
    const defaultPollingMock = () => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: null });
    usePolling.mockImplementation(() => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: 'req-file' }));
    try {
      const { result } = renderHook(() => useUniversalChat());
      offerTheFile(result);

      await act(async () => {
        await result.current.handleActionClick('new_record|temp-1');
      });
      expect(resolvedRefs(result)).toEqual(['temp-1']);

      await act(async () => {
        await result.current.cancelRequest();
      });

      expect(resolvedRefs(result)).toEqual([]);
    } finally {
      usePolling.mockImplementation(defaultPollingMock);
    }
  });

  it('restores it when the request never leaves the browser', async () => {
    const { result } = renderHook(() => useUniversalChat());
    offerTheFile(result);
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    await act(async () => {
      await result.current.handleActionClick('new_record|temp-1');
    });

    expect(resolvedRefs(result)).toEqual([]);
  });

  // The answer to the click is the one outcome that really decides the file, so it keeps the pair
  // retired — nothing here may undo `handlePollingResult`.
  it('keeps it retired when the turn actually answers', async () => {
    const { result } = renderHook(() => useUniversalChat());
    offerTheFile(result);

    await act(async () => {
      await result.current.handleActionClick('new_record|temp-1');
    });

    act(() => {
      lastPollingCallbacks().onResult({ message: 'Файл сохранён', pendingFiles: [] });
    });

    expect(resolvedRefs(result)).toEqual(['temp-1']);
  });
});

// D-B-14: a request started before a page reload keeps running on the server, and the pair
// `conversationId` + `requestId` in sessionStorage is the only thing that lets the reloaded page
// find it again. These tests cover the writing side of that pair; picking the request back up when
// the panel is opened is covered by useUniversalChatRestore.test.js.
describe('useUniversalChat - chat session persistence (D-B-14)', () => {
  let startPolling;
  let stopPolling;
  let activeRequestId;

  const defaultPollingMock = () => ({ startPolling: jest.fn(), stopPolling: jest.fn(), activeRequestId: null });

  const seedSession = (conversationId, requestId = null) =>
    sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify({ conversationId, requestId, savedAt: Date.now() }));

  const storedSession = () => JSON.parse(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY) || 'null');

  // usePolling is mocked; grab the callbacks the hook wired into it on the latest render.
  const lastPollingCallbacks = () => usePolling.mock.calls[usePolling.mock.calls.length - 1][0];

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    startPolling = jest.fn();
    stopPolling = jest.fn();
    activeRequestId = null;
    usePolling.mockImplementation(() => ({ startPolling, stopPolling, activeRequestId }));
    global.fetch = jest.fn();
  });

  afterEach(() => {
    sessionStorage.clear();
    usePolling.mockImplementation(defaultPollingMock);
  });

  // 9
  it('generates a fresh conversationId when there is nothing stored', () => {
    const { result } = renderHook(() => useUniversalChat());

    expect(result.current.conversationId).toMatch(/^test-uuid-/);
    // Nothing is written before a request actually exists
    expect(storedSession()).toBeNull();
  });

  // 10
  it('takes the conversationId from the stored session', () => {
    seedSession('conv-stored', 'req-stored');

    const { result } = renderHook(() => useUniversalChat());

    expect(result.current.conversationId).toBe('conv-stored');
  });

  // 11
  it('stores the conversation and the received requestId after a successful submit', async () => {
    seedSession('conv-seed');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-123' })
    });

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-seed', requestId: 'req-123' });
    expect(startPolling).toHaveBeenCalledWith('req-123');
    // The restored conversation is the one actually continued on the server
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).conversationId).toBe('conv-seed');
  });

  it('stores the requestId of an action click as well', async () => {
    seedSession('conv-seed');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ requestId: 'req-action' })
    });

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.handleActionClick('deploy_confirm');
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-seed', requestId: 'req-action' });
  });

  it('writes nothing when the request is refused by the backend', async () => {
    seedSession('conv-seed');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({ error: 'busy' })
    });

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('test message');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    // A refused turn never got a requestId, so there is nothing to resume after a reload
    expect(storedSession()).toMatchObject({ conversationId: 'conv-seed', requestId: null });
  });

  // 12
  it('clearConversation drops the record entirely and starts a new conversation', async () => {
    seedSession('conv-old', 'req-old');
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useUniversalChat());
    expect(result.current.conversationId).toBe('conv-old');

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(storedSession()).toBeNull();
    expect(result.current.conversationId).not.toBe('conv-old');
  });

  // Nothing disables the clear button while a request runs, so this really is reachable: the poll
  // used to survive the clear and drop its answer into the chat the user had just emptied, with the
  // input blocked by `isLoading` until it did.
  it('clearConversation stops an in-flight poll and unblocks the input', async () => {
    seedSession('conv-old', 'req-old');
    activeRequestId = 'req-old';
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-old' }) })
      .mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('test message');
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(stopPolling).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('clearConversation keeps the record when the server refuses the DELETE', async () => {
    seedSession('conv-old', 'req-old');
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.clearConversation();
    });

    // The hook stays on the old conversation, so the storage must not disagree with it
    expect(storedSession()).toMatchObject({ conversationId: 'conv-old', requestId: 'req-old' });
    expect(result.current.conversationId).toBe('conv-old');
  });

  it('clearConversation tells the user when the server refuses the DELETE', async () => {
    // Without this the button is simply dead: nothing is reset and nothing is said.
    seedSession('conv-old', 'req-old');
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(NotificationManager.error).toHaveBeenCalled();
    // A whole sentence naming what failed, not `chat.http-error` — that one is lowercase wording
    // built to sit after `chat.error-prefix`, and alone it reads as a truncated notification.
    const [body] = NotificationManager.error.mock.calls[0];
    expect(body).toBe(t('ai-assistant.notification.clear-chat-error-status', { status: 500 }));
    expect(body).not.toBe(t('ai-assistant.chat.http-error', { status: 500 }));
  });

  // The caller resets context of its own next to this call — the script-context chip in
  // `AIAssistantChat`. It has no other way to tell a refused clear from a successful one, and
  // dropping that chip anyway both contradicts the error notification and unbinds a script the chat
  // goes on sending with the next question.
  it('clearConversation reports whether the local reset ran', async () => {
    seedSession('conv-old', 'req-old');

    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const { result: refused } = renderHook(() => useUniversalChat());
    let refusedOutcome;
    await act(async () => {
      refusedOutcome = await refused.current.clearConversation();
    });
    expect(refusedOutcome).toBe(false);

    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    const { result: unreachable } = renderHook(() => useUniversalChat());
    let unreachableOutcome;
    await act(async () => {
      unreachableOutcome = await unreachable.current.clearConversation();
    });
    expect(unreachableOutcome).toBe(false);

    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const { result: cleared } = renderHook(() => useUniversalChat());
    let clearedOutcome;
    await act(async () => {
      clearedOutcome = await cleared.current.clearConversation();
    });
    expect(clearedOutcome).toBe(true);

    // A conversation the backend has already forgotten is cleared locally, so it reports success too
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    const { result: gone } = renderHook(() => useUniversalChat());
    let goneOutcome;
    await act(async () => {
      goneOutcome = await gone.current.clearConversation();
    });
    expect(goneOutcome).toBe(true);
  });

  it('clearConversation tells the user when the DELETE never reaches the service', async () => {
    seedSession('conv-old', 'req-old');
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(NotificationManager.error).toHaveBeenCalled();
    expect(result.current.conversationId).toBe('conv-old');
  });

  // Since D-B-14 the conversationId survives a reload, so a conversation the backend has forgotten
  // (expired, lost to a restart, refused by the owner guard) is restored on every reload of the tab.
  // A "clear chat" that quietly did nothing there would wedge the chat with no way out.
  it('clearConversation resets locally when the conversation is already gone server-side', async () => {
    seedSession('conv-old', 'req-old');
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    const { result } = renderHook(() => useUniversalChat());
    expect(result.current.conversationId).toBe('conv-old');

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(storedSession()).toBeNull();
    expect(result.current.conversationId).not.toBe('conv-old');
    expect(result.current.messages).toEqual([]);
    // A 404 is not a failure the user has to act on — the chat is cleared, which is what was asked
    expect(NotificationManager.error).not.toHaveBeenCalled();
  });

  // Nothing disables the clear button while its DELETE travels, so two quick clicks used to send two
  // of them: the second answered 404 — the conversation was already gone — which reads as success,
  // and the whole reset ran a second time.
  it('a double click on "clear chat" sends a single DELETE and resets once', async () => {
    seedSession('conv-old', 'req-old');
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, status: 200 }).mockResolvedValueOnce({ ok: false, status: 404 });

    const { result } = renderHook(() => useUniversalChat());

    let first;
    let second;
    act(() => {
      first = result.current.clearConversation();
      second = result.current.clearConversation();
    });

    let outcomes;
    await act(async () => {
      outcomes = await Promise.all([first, second]);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Both clicks learn the true outcome: the second one joins the first instead of being refused,
    // because a `false` makes the callers act — the agent selector reverts the agent just picked
    expect(outcomes).toEqual([true, true]);
    // One reset, so exactly one `stopPolling`
    expect(stopPolling).toHaveBeenCalledTimes(1);
    expect(storedSession()).toBeNull();
  });

  it('a double click on "clear chat" cannot wipe the question asked right after it', async () => {
    seedSession('conv-old', 'req-old');

    // The first DELETE answers at once; a second one — if the code still sends it — is held back
    // until the next question has been asked. That gap is where the double reset used to do damage.
    let releaseSecondDelete;
    const secondDelete = new Promise(resolve => {
      releaseSecondDelete = resolve;
    });
    let deleteCalls = 0;
    global.fetch = jest.fn(url => {
      if (String(url).includes('/conversation/')) {
        deleteCalls += 1;
        return deleteCalls === 1 ? Promise.resolve({ ok: true, status: 200 }) : secondDelete;
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-new' }) });
    });

    const { result } = renderHook(() => useUniversalChat());

    let first;
    let second;
    act(() => {
      first = result.current.clearConversation();
      second = result.current.clearConversation();
    });

    await act(async () => {
      await first;
    });

    act(() => {
      result.current.setMessage('вопрос после очистки');
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    const conversationOfTheQuestion = result.current.conversationId;
    expect(result.current.messages).not.toEqual([]);

    await act(async () => {
      releaseSecondDelete({ ok: false, status: 404 });
      await second;
    });

    // The question, its poll and the stored pair all survive a late answer to the second click
    expect(result.current.messages).not.toEqual([]);
    expect(result.current.conversationId).toBe(conversationOfTheQuestion);
    expect(storedSession()).toMatchObject({ conversationId: conversationOfTheQuestion, requestId: 'req-new' });
    expect(startPolling).toHaveBeenCalledWith('req-new');
  });

  // `stopPolling` only covers a request that is already being polled. A turn whose POST has not
  // answered yet has no poll to stop, and used to come back afterwards and write the deleted
  // conversation into the storage the clear had just wiped — the next reload then restored a chat
  // bound to a conversation the backend no longer had.
  it('a turn still in flight when the chat is cleared does not resurrect the deleted conversation', async () => {
    seedSession('conv-old', null);

    let resolvePost;
    const postResponse = new Promise(resolve => {
      resolvePost = resolve;
    });
    global.fetch = jest.fn(url => (String(url).includes('/conversation/') ? Promise.resolve({ ok: true }) : postResponse));

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('test message');
    });

    let submitted;
    act(() => {
      submitted = result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    await act(async () => {
      await result.current.clearConversation();
    });

    const freshConversationId = result.current.conversationId;
    expect(freshConversationId).not.toBe('conv-old');

    await act(async () => {
      resolvePost({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-late' }) });
      await submitted;
    });

    expect(startPolling).not.toHaveBeenCalled();
    expect(storedSession()).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.conversationId).toBe(freshConversationId);
  });

  it('an action still in flight when the chat is cleared does not resurrect the deleted conversation', async () => {
    seedSession('conv-old', null);

    let resolvePost;
    const postResponse = new Promise(resolve => {
      resolvePost = resolve;
    });
    global.fetch = jest.fn(url => (String(url).includes('/conversation/') ? Promise.resolve({ ok: true }) : postResponse));

    const { result } = renderHook(() => useUniversalChat());

    let clicked;
    act(() => {
      clicked = result.current.handleActionClick('deploy_confirm');
    });

    await act(async () => {
      await result.current.clearConversation();
    });

    await act(async () => {
      resolvePost({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-late' }) });
      await clicked;
    });

    expect(startPolling).not.toHaveBeenCalled();
    expect(storedSession()).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('a file action still in flight when the chat is cleared leaves no tempRef for the next conversation', async () => {
    seedSession('conv-old', null);

    let resolvePost;
    const postResponse = new Promise(resolve => {
      resolvePost = resolve;
    });
    global.fetch = jest.fn(url => (String(url).includes('/conversation/') ? Promise.resolve({ ok: true }) : postResponse));

    const { result } = renderHook(() => useUniversalChat());

    // A save click records the tempRef it answers before the POST leaves.
    let clicked;
    act(() => {
      clicked = result.current.handleActionClick('new_record|temp-file@A');
    });

    await act(async () => {
      await result.current.clearConversation();
    });

    await act(async () => {
      resolvePost({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-late' }) });
      await clicked;
    });

    // The first answer of the fresh conversation is an ordinary reply. Were the tempRef of the
    // discarded click still tracked, it would be consumed here — stamping the reply as a notice
    // about a file it never mentions and freezing an `agentStatus` it never spoke about.
    act(() => {
      lastPollingCallbacks().onResult({ message: 'Ответ новой переписки', agentStatus: null });
    });

    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.isFileActionNotice).toBeUndefined();
    expect(result.current.agentStatus).toBeNull();
  });

  // The same leak one step later: here the click's POST did answer, so the tempRef is tracked by a
  // poll — and `stopPolling` sees to it that no result of that poll ever reaches the result handler
  // that would consume it. Clearing the chat is a terminal path like any other and has to forget it.
  it('a file action already being polled when the chat is cleared leaves no tempRef for the next conversation', async () => {
    seedSession('conv-old', null);

    global.fetch = jest.fn(url =>
      String(url).includes('/conversation/')
        ? Promise.resolve({ ok: true })
        : Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) })
    );

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.handleActionClick('new_record|temp-file@A');
    });

    expect(startPolling).toHaveBeenCalledWith('req-file');

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(stopPolling).toHaveBeenCalled();

    act(() => {
      lastPollingCallbacks().onResult({ message: 'Ответ новой переписки', agentStatus: null });
    });

    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.isFileActionNotice).toBeUndefined();
    expect(result.current.agentStatus).toBeNull();
  });

  it('a turn that fails while the chat is being cleared does not drop its error into the emptied chat', async () => {
    seedSession('conv-old', null);

    let rejectPost;
    const postResponse = new Promise((resolve, reject) => {
      rejectPost = reject;
    });
    global.fetch = jest.fn(url => (String(url).includes('/conversation/') ? Promise.resolve({ ok: true }) : postResponse));

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessage('test message');
    });

    let submitted;
    act(() => {
      submitted = result.current.handleSubmit({ preventDefault: jest.fn() });
    });

    await act(async () => {
      await result.current.clearConversation();
    });

    await act(async () => {
      rejectPost(new Error('network down'));
      await submitted;
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  // 13
  it('cancelRequest clears the requestId and keeps the conversation', async () => {
    seedSession('conv-1', 'req-1');
    activeRequestId = 'req-1';
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.cancelRequest();
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: null });
  });

  it('cancelRequest keeps the requestId when the server refuses the cancellation', async () => {
    seedSession('conv-1', 'req-1');
    activeRequestId = 'req-1';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.cancelRequest();
    });

    // The request is still running server-side — dropping the id would strand it for good
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-1' });
    // …and nothing on screen changes, so without a notification the Cancel button reads as broken
    expect(NotificationManager.error).toHaveBeenCalled();
    const [body] = NotificationManager.error.mock.calls[0];
    expect(body).toBe(t('ai-assistant.notification.cancel-request-error-status', { status: 500 }));
  });

  // A 404 says the backend no longer holds the request: there is nothing left to cancel and nothing
  // to strand, so the local cancellation runs as on a confirmed one. Reported as a refusal instead,
  // one click produced two contradictory messages — «не удалось отменить» here, then «запрос
  // потерян» when the poll met the same 404 — and left the card spinning.
  it('cancelRequest treats a 404 as a request that is already gone', async () => {
    seedSession('conv-1', 'req-1');
    activeRequestId = 'req-1';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.cancelRequest();
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: null });
    expect(NotificationManager.error).not.toHaveBeenCalled();
  });

  it('cancelRequest tells the user when the DELETE never reached the server', async () => {
    seedSession('conv-1', 'req-1');
    activeRequestId = 'req-1';
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.cancelRequest();
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-1' });
    expect(NotificationManager.error).toHaveBeenCalledWith(
      t('ai-assistant.notification.cancel-request-error'),
      t('ai-assistant.notification.cancel-request-error-title')
    );
  });

  // 14
  // The finished request is kept and marked, not forgotten: a turn may end on a gate the backend is
  // still holding, and the id is the only way to bring that card back after a reload (D-B-14).
  it('marks the requestId completed once the request completes', () => {
    seedSession('conv-1', 'req-1');

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onResult({ message: 'готово' });
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-1', requestCompleted: true });
    expect(result.current.isLoading).toBe(false);
  });

  // 15
  it('clears the requestId when the request itself fails', () => {
    seedSession('conv-1', 'req-1');

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      // The `data.error` branch of `usePolling`: the backend has decided the outcome of the request
      lastPollingCallbacks().onError('boom', { requestAlive: false });
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: null });
    expect(result.current.isLoading).toBe(false);
  });

  it('keeps the requestId when polling gives up on a request that may still be running', () => {
    seedSession('conv-1', 'req-1');

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      // The client watchdog and every transport failure raise this: the backend never said the
      // request was over, and it keeps a result for an hour after it kills a request, so the id
      // has to survive for a reload to pick the answer up (D-B-14)
      lastPollingCallbacks().onError(t('ai-assistant.chat.polling-timeout'), { requestAlive: true });
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: 'req-1' });
    // The turn is over on screen either way — the input must not stay blocked
    expect(result.current.isLoading).toBe(false);
  });

  // The card is the only place the kept id is ever mentioned. Without the hint the branch above
  // delivers nothing: the user sees a failed turn, asks again — and the next `saveSession` writes
  // over the very id that was kept, putting the answer out of reach for good.
  it('tells the user how to pick up a request that may still be running', () => {
    seedSession('conv-1', 'req-1');

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessages([{ id: 'm1', text: 'обработка', sender: 'ai', isProcessing: true }]);
    });

    act(() => {
      lastPollingCallbacks().onError(t('ai-assistant.chat.polling-timeout'), { requestAlive: true });
    });

    expect(result.current.messages[0].text).toBe(
      `${t('ai-assistant.chat.error-prefix', { error: t('ai-assistant.chat.polling-timeout') })} ${t(
        'ai-assistant.chat.request-resumable-hint'
      )}`
    );
  });

  it('does not offer to pick up a request that is over', () => {
    seedSession('conv-1', 'req-1');

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessages([{ id: 'm1', text: 'обработка', sender: 'ai', isProcessing: true }]);
    });

    act(() => {
      // The `data.error` branch: the id is cleared here, so pointing at it would be a lie
      lastPollingCallbacks().onError('boom', { requestAlive: false });
    });

    expect(result.current.messages[0].text).not.toContain(t('ai-assistant.chat.request-resumable-hint'));
  });

  // The counterpart of the id being kept: only `pendingFileActionTempRef` says that what is being
  // resumed is the answer to a file-save click. Cleared on the way out, the resumed answer came back
  // untagged — counted by `isSupersededByNewerMessage` as a step of the dialog, so it retired the
  // gate merged into the same set that the backend is still waiting on.
  it('keeps a file-save click recognisable across a poll that gave up', async () => {
    seedSession('conv-1');
    global.fetch = jest.fn(url =>
      String(url).includes('/conversation/')
        ? Promise.resolve({ ok: true })
        : Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) })
    );

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.handleActionClick('new_record|temp-file@A');
    });

    act(() => {
      lastPollingCallbacks().onError(t('ai-assistant.chat.polling-timeout'), { requestAlive: true });
    });

    // What the restore effect does when the panel is reopened: the same request, polled again
    act(() => {
      lastPollingCallbacks().onResult({ message: 'Файл сохранён' });
    });

    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.text).toBe('Файл сохранён');
    expect(last.isFileActionNotice).toBe(true);
  });

  it('forgets a file-save click once its request is over', async () => {
    seedSession('conv-1');
    global.fetch = jest.fn(url =>
      String(url).includes('/conversation/')
        ? Promise.resolve({ ok: true })
        : Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ requestId: 'req-file' }) })
    );

    const { result } = renderHook(() => useUniversalChat());

    await act(async () => {
      await result.current.handleActionClick('new_record|temp-file@A');
    });

    act(() => {
      // A backend-reported failure ends the request: nothing will come back to consume the tempRef,
      // and a later unrelated result must not be read as the answer to that save
      lastPollingCallbacks().onError('boom', { requestAlive: false });
    });

    act(() => {
      lastPollingCallbacks().onResult({ message: 'Ответ на следующий вопрос', agentStatus: null });
    });

    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.isFileActionNotice).toBeUndefined();
    expect(result.current.agentStatus).toBeNull();
  });

  it('clears the requestId when the request is cancelled server-side', () => {
    seedSession('conv-1', 'req-1');

    renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onCancelled();
    });

    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: null });
  });

  // 16
  it('clears the requestId and reports a lost request on a 404', () => {
    seedSession('conv-1', 'req-1');

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setMessages([{ id: 'm1', text: 'обработка', sender: 'ai', isProcessing: true }]);
    });

    act(() => {
      lastPollingCallbacks().onError(t('ai-assistant.chat.request-lost'), { requestLost: true });
    });

    expect(result.current.messages[0].text).toBe(t('ai-assistant.chat.request-lost'));
    expect(result.current.messages[0].text).not.toBe(t('ai-assistant.chat.result-error'));
    expect(result.current.messages[0].isError).toBe(true);
    // A request the server no longer knows must not be resumed after the next reload either
    expect(storedSession()).toMatchObject({ conversationId: 'conv-1', requestId: null });
  });
});

// `handlePollingProgress` rebuilds the agent card's `messageData` from the incoming emission alone,
// so anything the emission omits is gone from the card. For the planner-feedback group of
// COREDEV-484 that meant a single heartbeat without `planning` blanked the facts line mid-planning
// and the next emission brought it back. The group survives an emission that says nothing about it,
// and moves as a whole whenever an emission does speak — a `retryReason` never outlives its attempt.
describe('useUniversalChat - planner feedback across emissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const startPlanning = result => {
    act(() => {
      result.current.setMessages([{ id: 'm1', sender: 'ai', isProcessing: true }]);
    });
    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_planning',
        currentAttempt: 2,
        maxAttempts: 3,
        retryReason: 'план не прошёл проверку',
        businessApp: { planning: { specRead: true, requirementCount: 7 } }
      });
    });
  };

  it('keeps the planner facts and the attempt line when the next emission omits them', () => {
    const { result } = renderHook(() => useUniversalChat());
    startPlanning(result);

    act(() => {
      lastPollingCallbacks().onProgress({ type: 'agent_planning', progress: 40 });
    });

    expect(result.current.messages[0].messageData).toMatchObject({
      currentAttempt: 2,
      maxAttempts: 3,
      retryReason: 'план не прошёл проверку',
      planning: { specRead: true, requirementCount: 7 }
    });
  });

  it('replaces the whole planner group when an emission carries any of its fields', () => {
    const { result } = renderHook(() => useUniversalChat());
    startPlanning(result);

    // The third attempt starts for no stated reason: the reason of the second must not be carried
    // onto it, or the card would explain this attempt with the failure of the previous one.
    act(() => {
      lastPollingCallbacks().onProgress({ type: 'agent_planning', currentAttempt: 3, maxAttempts: 3 });
    });

    expect(result.current.messages[0].messageData.currentAttempt).toBe(3);
    expect(result.current.messages[0].messageData.retryReason).toBeUndefined();
    expect(result.current.messages[0].messageData.planning).toBeUndefined();
  });

  it('does not carry the planner group onto an emission of another phase', () => {
    const { result } = renderHook(() => useUniversalChat());
    startPlanning(result);

    act(() => {
      lastPollingCallbacks().onProgress({ type: 'agent_execution', completedSteps: 1, totalSteps: 4 });
    });

    expect(result.current.messages[0].messageData.type).toBe('agent_execution');
    expect(result.current.messages[0].messageData.planning).toBeUndefined();
    expect(result.current.messages[0].messageData.currentAttempt).toBeUndefined();
  });
});
