import Records from '@citeck/records-core';
import { renderHook, act } from '@testing-library/react';

import editorContextService from '../EditorContextService';
import { CHAT_SESSION_STORAGE_KEY } from '../chatSessionStorage';
import usePolling from '../hooks/usePolling';
import useUniversalChat from '../hooks/useUniversalChat';

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
          availableStages: [{ stage: 'ANALYZING_REQUIREMENTS' }, { stage: 'GENERATING_FORMS' }]
        }
      });
    });

    expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'GENERATING_FORMS', progress: 55 });
    expect(result.current.generationStages).toEqual([{ stage: 'ANALYZING_REQUIREMENTS' }, { stage: 'GENERATING_FORMS' }]);
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

  it('does not overwrite generationStages once set (guard)', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      // usePolling always receives the freshest callback on each render, so re-read it per emission.
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 20, availableStages: [{ stage: 'FIRST' }] }
      });
    });
    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ stage: 'SECOND' }] }
      });
    });

    // stage/progress keep advancing, but the stage list is seeded only once.
    expect(result.current.activeBusinessAppProgress).toEqual({ stage: 'GENERATING_FORMS', progress: 55 });
    expect(result.current.generationStages).toEqual([{ stage: 'FIRST' }]);
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
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ stage: 'X' }] }
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
          businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ stage: 'X' }] }
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

  // D-B-7: a failed turn has to leave the same clean slate the success path does. The stage list is
  // seeded only while it is null, so a leftover one would be shown for the NEXT, unrelated request.
  it('clears the stage list along with the stepper when polling fails', () => {
    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'GENERATING_FORMS', progress: 55, availableStages: [{ stage: 'FIRST' }] }
      });
    });
    expect(result.current.generationStages).toEqual([{ stage: 'FIRST' }]);

    act(() => {
      lastPollingCallbacks().onError('boom');
    });

    expect(result.current.activeBusinessAppProgress).toBeNull();
    expect(result.current.generationStages).toBeNull();

    // The next request seeds its own stage list, which the stale one would have blocked
    act(() => {
      lastPollingCallbacks().onProgress({
        type: 'agent_execution',
        businessApp: { stage: 'ANALYZING_REQUIREMENTS', progress: 10, availableStages: [{ stage: 'SECOND' }] }
      });
    });

    expect(result.current.generationStages).toEqual([{ stage: 'SECOND' }]);
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
      // The client watchdog (10 min) and every transport failure raise this: the backend allows the
      // request 30 min and keeps its result an hour longer, so the id has to survive for a reload
      // to pick the answer up (D-B-14)
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
