jest.mock('../AIAssistantService', () => ({
  __esModule: true,
  default: {
    checkAvailability: jest.fn()
  }
}));

import editorContextService, { CONTEXT_TYPES } from '../EditorContextService';
import aiAssistantService from '../AIAssistantService';

describe('EditorContextService', () => {
  beforeEach(() => {
    editorContextService.currentContext = null;
    editorContextService.contextHandlers = {};
    editorContextService.contextData = {};
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('setContext', () => {
    it('sets context type, handlers, and data', () => {
      const handlers = { onSubmit: jest.fn() };
      const data = { bpmnXml: '<xml/>' };

      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR, handlers, data);

      expect(editorContextService.getContext()).toBe(CONTEXT_TYPES.BPMN_EDITOR);
      expect(editorContextService.getHandlers()).toBe(handlers);
      expect(editorContextService.getContextData()).toBe(data);
    });

    it('triggers availability check when context was empty', () => {
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR);

      jest.advanceTimersByTime(100);

      expect(aiAssistantService.checkAvailability).toHaveBeenCalled();
    });

    it('does not trigger availability check when context was already set', () => {
      editorContextService.currentContext = CONTEXT_TYPES.UNIVERSAL;

      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR);

      jest.advanceTimersByTime(100);
      expect(aiAssistantService.checkAvailability).not.toHaveBeenCalled();
    });
  });

  describe('clearContext', () => {
    it('clears the current context', () => {
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR);
      jest.advanceTimersByTime(100);
      jest.clearAllMocks();

      editorContextService.clearContext();

      expect(editorContextService.getContext()).toBeNull();
    });

    it('triggers availability check when context existed', () => {
      editorContextService.currentContext = CONTEXT_TYPES.BPMN_EDITOR;
      editorContextService.clearContext();

      expect(aiAssistantService.checkAvailability).toHaveBeenCalled();
    });

    it('does not trigger availability check when no context', () => {
      editorContextService.clearContext();

      expect(aiAssistantService.checkAvailability).not.toHaveBeenCalled();
    });
  });

  describe('hasContext / hasContextType', () => {
    it('returns false when no context', () => {
      expect(editorContextService.hasContext()).toBe(false);
      expect(editorContextService.hasContextType(CONTEXT_TYPES.BPMN_EDITOR)).toBe(false);
    });

    it('returns true when context is set', () => {
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR);

      expect(editorContextService.hasContext()).toBe(true);
      expect(editorContextService.hasContextType(CONTEXT_TYPES.BPMN_EDITOR)).toBe(true);
      expect(editorContextService.hasContextType(CONTEXT_TYPES.UNIVERSAL)).toBe(false);
    });
  });

  describe('handlers', () => {
    it('getHandler returns the handler by name', () => {
      const handler = jest.fn();
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR, { onSubmit: handler });

      expect(editorContextService.getHandler('onSubmit')).toBe(handler);
    });

    it('getHandler returns undefined for missing handler', () => {
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR, {});

      expect(editorContextService.getHandler('onSubmit')).toBeUndefined();
    });

    it('getHandlers returns empty object when no context', () => {
      expect(editorContextService.getHandlers()).toEqual({});
    });

    it('callHandler invokes the handler with args', () => {
      const handler = jest.fn().mockReturnValue('result');
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR, { onSubmit: handler });

      const result = editorContextService.callHandler('onSubmit', 'arg1', 'arg2');

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('result');
    });

    it('callHandler returns null for missing handler', () => {
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR, {});

      expect(editorContextService.callHandler('missing')).toBeNull();
    });

    it('callHandler returns null for non-function handler', () => {
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR, { onSubmit: 'not-a-function' });

      expect(editorContextService.callHandler('onSubmit')).toBeNull();
    });

    it('callHandler returns null when no context', () => {
      expect(editorContextService.callHandler('onSubmit')).toBeNull();
    });
  });

  describe('context data', () => {
    it('getContextData returns empty object when no context', () => {
      expect(editorContextService.getContextData()).toEqual({});
    });

    it('updateContextData merges data', () => {
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR, {}, { key1: 'val1' });

      editorContextService.updateContextData({ key2: 'val2' });

      expect(editorContextService.getContextData()).toEqual({ key1: 'val1', key2: 'val2' });
    });

    it('updateContextData does nothing when no context', () => {
      editorContextService.updateContextData({ key: 'val' });

      expect(editorContextService.getContextData()).toEqual({});
    });

    it('updateContextData overwrites existing keys', () => {
      editorContextService.setContext(CONTEXT_TYPES.BPMN_EDITOR, {}, { key: 'old' });

      editorContextService.updateContextData({ key: 'new' });

      expect(editorContextService.getContextData()).toEqual({ key: 'new' });
    });
  });
});
