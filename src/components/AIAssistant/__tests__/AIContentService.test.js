jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn(() => 'test-workspace')
}));

jest.mock('@/helpers/export/util', () => ({
  t: jest.fn((key, defaultVal) => {
    if (typeof defaultVal === 'string') return defaultVal;
    if (typeof defaultVal === 'object') return key;
    return key;
  })
}));

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: jest.fn()
  }
}));

import { generateContent, cancelRequest } from '../AIContentService';
import { API_ENDPOINTS, MESSAGE_TYPES, CONTENT_TYPES } from '../constants';
import { NotificationManager } from '@/services/notifications';

describe('AIContentService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateContent', () => {
    describe('text content', () => {
      const textParams = {
        currentContent: 'Hello world',
        contentType: CONTENT_TYPES.TEXT,
        quickAction: 'improve'
      };

      it('sends text editing request', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({
          result: {
            message: {
              type: MESSAGE_TYPES.TEXT_EDITING,
              generatedText: 'Improved',
              explanation: 'Better'
            }
          }
        }));

        const promise = generateContent(textParams);
        await jest.advanceTimersByTimeAsync(0);
        const result = await promise;

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.context.forceIntent).toBe('text_editing');
        expect(body.context.editing.type).toBe('text');
        expect(result.generated).toBe('Improved');
        expect(result.explanation).toBe('Better');
        expect(result.contentType).toBe(CONTENT_TYPES.TEXT);
      });
    });

    describe('code content', () => {
      const codeParams = {
        currentContent: 'var x = 1;',
        contentType: CONTENT_TYPES.CODE,
        contextType: 'computed_attribute'
      };

      it('sends script writing request', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({
          result: {
            message: {
              type: MESSAGE_TYPES.SCRIPT_WRITING,
              modifiedScript: 'const x = 1;',
              explanation: 'Used const'
            }
          }
        }));

        const promise = generateContent(codeParams);
        await jest.advanceTimersByTimeAsync(0);
        const result = await promise;

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.context.forceIntent).toBe('script_writing');
        expect(body.context.editing.type).toBe('script');
        expect(result.generated).toBe('const x = 1;');
        expect(result.contentType).toBe(CONTENT_TYPES.CODE);
      });
    });

    describe('error handling', () => {
      const params = {
        currentContent: 'test',
        contentType: CONTENT_TYPES.TEXT
      };

      it('shows notification on network error', async () => {
        fetchMock.mockRejectOnce(new Error('Network error'));

        await expect(generateContent(params)).rejects.toThrow();
        expect(NotificationManager.error).toHaveBeenCalled();
      });

      it('shows notification on non-ok response', async () => {
        fetchMock.mockResponseOnce('Server error', { status: 500 });

        await expect(generateContent(params)).rejects.toThrow('Request failed: 500');
        expect(NotificationManager.error).toHaveBeenCalled();
      });

      it('shows notification when no requestId', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({}));

        await expect(generateContent(params)).rejects.toThrow('Failed to get request ID');
        expect(NotificationManager.error).toHaveBeenCalled();
      });

      it('shows notification on polling network error', async () => {
        jest.useRealTimers();
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockRejectOnce(new Error('Network error'));

        await expect(generateContent(params)).rejects.toThrow();
        expect(NotificationManager.error).toHaveBeenCalled();
      });

      it('rejects on cancelled status', async () => {
        jest.useRealTimers();
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({ status: 'cancelled' }));

        await expect(generateContent(params)).rejects.toThrow('Request was cancelled');
      });

      it('rejects on error in poll response', async () => {
        jest.useRealTimers();
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({ error: 'Processing failed' }));

        await expect(generateContent(params)).rejects.toThrow('Processing failed');
      });
    });

    describe('response parsing', () => {
      const params = {
        currentContent: 'test',
        contentType: CONTENT_TYPES.TEXT
      };

      it('parses plain text response', async () => {
        jest.useRealTimers();
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({
          result: { message: 'Plain text' }
        }));

        const result = await generateContent(params);

        expect(result.generated).toBe('Plain text');
      });

      it('parses generic text response with message.text', async () => {
        jest.useRealTimers();
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({
          result: { message: { text: 'text result', explanation: 'info' } }
        }));

        const result = await generateContent(params);

        expect(result.generated).toBe('text result');
        expect(result.explanation).toBe('info');
      });

      it('handles text_editing with description but no generated text', async () => {
        jest.useRealTimers();
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({
          result: {
            message: {
              type: MESSAGE_TYPES.TEXT_EDITING,
              description: 'Cannot process'
            }
          }
        }));

        await expect(generateContent(params)).rejects.toThrow('Cannot process');
      });

      it('rejects for unexpected response type', async () => {
        jest.useRealTimers();
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({
          result: { message: { type: 'unknown' } }
        }));

        await expect(generateContent(params)).rejects.toThrow('Unexpected response type from AI');
      });
    });

    describe('polling with progress', () => {
      it('reports progress during polling', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ requestId: 'req-1' }));
        fetchMock.mockResponseOnce(JSON.stringify({
          status: 'processing',
          progress: { stage: 'gen', progress: 50, message: 'Working...' }
        }));
        fetchMock.mockResponseOnce(JSON.stringify({
          result: { message: { type: MESSAGE_TYPES.TEXT_EDITING, generatedText: 'done' } }
        }));

        const onProgress = jest.fn();
        const promise = generateContent({
          currentContent: 'test',
          contentType: CONTENT_TYPES.TEXT,
          onProgress
        });

        await jest.advanceTimersByTimeAsync(0);
        await jest.advanceTimersByTimeAsync(1000);
        await jest.advanceTimersByTimeAsync(1000);

        const result = await promise;
        expect(result.generated).toBe('done');
        expect(onProgress).toHaveBeenCalledWith({
          stage: 'gen',
          progress: 50,
          message: 'Working...'
        });
      });
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
  });

});
