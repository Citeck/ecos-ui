import { renderHook, act } from '@testing-library/react';

import editorContextService from '../EditorContextService';
import usePolling from '../hooks/usePolling';
import useUniversalChat from '../hooks/useUniversalChat';

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

describe('useUniversalChat - autoContextArtifacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('initializes autoContextArtifacts as empty array', () => {
    const { result } = renderHook(() => useUniversalChat());
    expect(result.current.autoContextArtifacts).toEqual([]);
  });

  it('setAutoContextArtifacts updates the state', () => {
    const { result } = renderHook(() => useUniversalChat());

    const artifacts = [{ ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }];

    act(() => {
      result.current.setAutoContextArtifacts(artifacts);
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
      result.current.setAutoContextArtifacts(artifacts);
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
      result.current.setAutoContextArtifacts(artifacts);
    });

    act(() => {
      result.current.removeAutoContextArtifact('non-existent-ref');
    });

    expect(result.current.autoContextArtifacts).toEqual(artifacts);
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
      result.current.setAutoContextArtifacts(artifacts);
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
      result.current.setAutoContextArtifacts(artifacts);
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
      result.current.setAutoContextArtifacts([{ ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }]);
    });

    expect(result.current.autoContextArtifacts).toHaveLength(1);

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(result.current.autoContextArtifacts).toEqual([]);
  });
});

describe('useUniversalChat - selectedAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
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

    // restore default so the persisted return value does not leak into later tests
    editorContextService.getContextData.mockReturnValue({});
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

    // restore default so the persisted return value does not leak into later tests
    editorContextService.getContextData.mockReturnValue({});
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
});
