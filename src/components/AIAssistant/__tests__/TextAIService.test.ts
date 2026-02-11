jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-workspace')
}));

import { generateText, cancelRequest } from '../TextAIService';
import { API_ENDPOINTS, MESSAGE_TYPES } from '../constants';

describe('TextAIService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateText', () => {
    const defaultParams = {
      currentText: 'Hello world',
      quickAction: 'improve'
    };

    it('sends correct request body', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: {
            type: MESSAGE_TYPES.TEXT_EDITING,
            generatedText: 'Hello, World!',
            explanation: 'Improved'
          }
        }
      }));

      const promise = generateText(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      await promise;

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.context.forceIntent).toBe('text_editing');
      expect(body.context.editing.content).toBe('Hello world');
      expect(body.context.editing.quickAction).toBe('improve');
      expect(body.context.workspace).toBe('test-workspace');
    });

    it('resolves with text editing response', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: {
            type: MESSAGE_TYPES.TEXT_EDITING,
            generatedText: 'Improved text',
            explanation: 'Fixed grammar'
          }
        }
      }));

      const promise = generateText(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      const result = await promise;

      expect(result).toEqual({
        originalText: 'Hello world',
        generatedText: 'Improved text',
        explanation: 'Fixed grammar'
      });
    });

    it('resolves with plain text response', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: { message: 'plain text result' }
      }));

      const promise = generateText(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      const result = await promise;

      expect(result.generatedText).toBe('plain text result');
    });

    it('resolves with generic text response (message.text)', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: { text: 'generic text', explanation: 'explain' }
        }
      }));

      const promise = generateText(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      const result = await promise;

      expect(result.generatedText).toBe('generic text');
      expect(result.explanation).toBe('explain');
    });

    it('throws when initial request fails', async () => {
      fetchMock.mockResponseOnce('', { status: 500 });

      await expect(generateText(defaultParams)).rejects.toThrow('Request failed: 500');
    });

    it('throws when no requestId returned', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}));

      await expect(generateText(defaultParams)).rejects.toThrow('Failed to get request ID');
    });

    it('calls onRequestId callback', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: { message: { type: MESSAGE_TYPES.TEXT_EDITING, generatedText: 'ok' } }
      }));

      const onRequestId = jest.fn();
      const promise = generateText({ ...defaultParams, onRequestId });
      await jest.advanceTimersByTimeAsync(0);
      await promise;

      expect(onRequestId).toHaveBeenCalledWith('req-1');
    });

    it('rejects with error message from text editing response without generated text', async () => {
      jest.useRealTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: {
            type: MESSAGE_TYPES.TEXT_EDITING,
            description: 'Cannot process this request'
          }
        }
      }));

      await expect(generateText(defaultParams)).rejects.toThrow('Cannot process this request');
    });

    it('rejects on polling error response', async () => {
      jest.useRealTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({ error: 'Server error' }));

      await expect(generateText(defaultParams)).rejects.toThrow('Server error');
    });

    it('rejects on cancelled status', async () => {
      jest.useRealTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({ status: 'cancelled' }));

      await expect(generateText(defaultParams)).rejects.toThrow('Request was cancelled');
    });

    it('polls on processing status and calls onProgress', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        status: 'processing',
        progress: { stage: 'generating', progress: 50, message: 'Working...' }
      }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: { message: { type: MESSAGE_TYPES.TEXT_EDITING, generatedText: 'done' } }
      }));

      const onProgress = jest.fn();
      const promise = generateText({ ...defaultParams, onProgress });

      // First poll: sends initial request
      await jest.advanceTimersByTimeAsync(0);
      // Second poll: processing, schedules next
      await jest.advanceTimersByTimeAsync(1000);
      // Third poll: result
      await jest.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result.generatedText).toBe('done');
      expect(onProgress).toHaveBeenCalledWith({
        stage: 'generating',
        progress: 50,
        message: 'Working...'
      });
    });

    it('rejects on unexpected response type', async () => {
      jest.useRealTimers();
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: { message: { type: 'unknown_type' } }
      }));

      await expect(generateText(defaultParams)).rejects.toThrow('Unexpected response type from AI');
    });

    it('handles modifiedText fallback in text editing response', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
      fetchMock.mockResponseOnce(JSON.stringify({
        result: {
          message: {
            type: MESSAGE_TYPES.TEXT_EDITING,
            modifiedText: 'modified version',
            description: 'Changed'
          }
        }
      }));

      const promise = generateText(defaultParams);
      await jest.advanceTimersByTimeAsync(0);
      const result = await promise;

      expect(result.generatedText).toBe('modified version');
      expect(result.explanation).toBe('Changed');
    });
  });

  describe('cancelRequest', () => {
    it('sends DELETE request', async () => {
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

    it('returns false when response is not ok', async () => {
      fetchMock.mockResponseOnce('', { status: 500 });

      const result = await cancelRequest('req-1');

      expect(result).toBe(false);
    });
  });

});
