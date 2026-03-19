import { renderHook, act } from '@testing-library/react';
import useUniversalChat from '../hooks/useUniversalChat';

// Mock dependencies
jest.mock('../utils', () => ({
  generateUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).slice(2, 8))
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-workspace')
}));

jest.mock('../../Records', () => ({
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

    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }
    ];

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

    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }
    ];

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
    expect(requestBody.context.contextArtifacts).toEqual([
      { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }
    ]);
  });

  it('clearConversation resets autoContextArtifacts to empty array', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useUniversalChat());

    act(() => {
      result.current.setAutoContextArtifacts([
        { ref: 'emodel/type@employee', displayName: 'Employee', type: 'DATA_TYPE' }
      ]);
    });

    expect(result.current.autoContextArtifacts).toHaveLength(1);

    await act(async () => {
      await result.current.clearConversation();
    });

    expect(result.current.autoContextArtifacts).toEqual([]);
  });
});
