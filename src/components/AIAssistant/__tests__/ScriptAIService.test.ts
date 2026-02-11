jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-workspace')
}));

import { generateScript, cancelRequest } from '../ScriptAIService';
import { API_ENDPOINTS, MESSAGE_TYPES } from '../constants';

describe('ScriptAIService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateScript', () => {
    const defaultParams = {
      currentScript: 'var x = 1;',
      contextType: 'computed_attribute',
      recordRef: 'rec-1'
    };

    it('sends correct request body', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: {
            type: MESSAGE_TYPES.SCRIPT_WRITING,
            modifiedScript: 'let x = 1;',
            explanation: 'Used let'
          }
        }
      }));

      const promise = generateScript(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      await promise;

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.context.forceIntent).toBe('script_writing');
      expect(body.context.editing.type).toBe('script');
      expect(body.context.editing.content).toBe('var x = 1;');
      expect(body.context.editing.contextType).toBe('computed_attribute');
      expect(body.context.editing.recordRef).toBe('rec-1');
      expect(body.context.workspace).toBe('test-workspace');
    });

    it('resolves with script writing response', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: {
            type: MESSAGE_TYPES.SCRIPT_WRITING,
            originalScript: 'var x = 1;',
            modifiedScript: 'const x = 1;',
            explanation: 'Used const',
            contextType: 'computed_attribute'
          }
        }
      }));

      const promise = generateScript(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      const result = await promise;

      expect(result).toEqual({
        originalScript: 'var x = 1;',
        modifiedScript: 'const x = 1;',
        explanation: 'Used const',
        contextType: 'computed_attribute'
      });
    });

    it('throws when initial request fails', async () => {
      fetchMock.mockResponseOnce('', { status: 500 });

      await expect(generateScript(defaultParams)).rejects.toThrow('Request failed: 500');
    });

    it('throws when no requestId returned', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}));

      await expect(generateScript(defaultParams)).rejects.toThrow('Failed to get request ID');
    });

    it('calls onRequestId callback', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: { type: MESSAGE_TYPES.SCRIPT_WRITING, modifiedScript: 'ok' }
        }
      }));

      const onRequestId = jest.fn();
      const promise = generateScript({ ...defaultParams, onRequestId });
      await jest.advanceTimersByTimeAsync(0);
      await promise;

      expect(onRequestId).toHaveBeenCalledWith('req-1');
    });

    it('rejects on error response', async () => {
      jest.useRealTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({ error: 'Failed' }));

      await expect(generateScript(defaultParams)).rejects.toThrow('Failed');
    });

    it('rejects on cancelled status', async () => {
      jest.useRealTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({ status: 'cancelled' }));

      await expect(generateScript(defaultParams)).rejects.toThrow('Request was cancelled');
    });

    it('polls and reports progress', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        status: 'processing',
        progress: { stage: 'analyzing', progress: 30, message: 'Analyzing...' }
      }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: { type: MESSAGE_TYPES.SCRIPT_WRITING, modifiedScript: 'done' }
        }
      }));

      const onProgress = jest.fn();
      const promise = generateScript({ ...defaultParams, onProgress });

      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result.modifiedScript).toBe('done');
      expect(onProgress).toHaveBeenCalledWith({
        stage: 'analyzing',
        progress: 30,
        message: 'Analyzing...'
      });
    });

    it('rejects on unexpected response type', async () => {
      jest.useRealTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: { message: { type: 'text_editing' } }
      }));

      await expect(generateScript(defaultParams)).rejects.toThrow('Unexpected response type from AI');
    });

    it('handles optional parameters', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: { type: MESSAGE_TYPES.SCRIPT_WRITING, modifiedScript: 'ok' }
        }
      }));

      const promise = generateScript({
        ...defaultParams,
        prompt: 'Fix bugs',
        quickAction: 'fix',
        ecosType: 'emodel/type@test',
        processRef: 'proc-1',
        metadata: 'meta',
        field: { id: 'script', name: 'Script', type: 'TEXT' as const },
        conversationId: 'conv-1'
      });
      await jest.advanceTimersByTimeAsync(0);
      await promise;

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.message).toBe('Fix bugs');
      expect(body.context.editing.quickAction).toBe('fix');
      expect(body.context.editing.ecosType).toBe('emodel/type@test');
      expect(body.context.editing.processRef).toBe('proc-1');
      expect(body.context.editing.metadata).toBe('meta');
      expect(body.conversationId).toBe('conv-1');
    });

    it('rejects on polling HTTP error', async () => {
      jest.useRealTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce('', { status: 500 });

      await expect(generateScript(defaultParams)).rejects.toThrow('Polling failed: 500');
    });
  });

  describe('cancelRequest', () => {
    it('sends DELETE request and returns true on success', async () => {
      fetchMock.mockResponseOnce('', { status: 200 });

      const result = await cancelRequest('req-1');

      expect(fetchMock).toHaveBeenCalledWith(
        `${API_ENDPOINTS.UNIVERSAL_STATUS}/req-1`,
        { method: 'DELETE' }
      );
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      fetchMock.mockRejectOnce(new Error('network'));

      const result = await cancelRequest('req-1');

      expect(result).toBe(false);
      errorSpy.mockRestore();
    });
  });

});
