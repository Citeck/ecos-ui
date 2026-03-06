jest.mock('../EditorContextService', () => ({
  __esModule: true,
  default: {
    hasContext: jest.fn(),
    callHandler: jest.fn()
  }
}));

const editorContextService = require('../EditorContextService').default;

// We need a fresh instance for each test, so import the class
// The module exports a singleton, so we re-instantiate manually
describe('AIAssistantService', () => {
  let service;

  beforeEach(() => {
    // Create fresh instance by importing the class prototype
    const AIAssistantServiceModule = require('../AIAssistantService');
    // Reset and create new instance
    service = Object.create(AIAssistantServiceModule.default);
    service.isOpen = false;
    service.isMinimized = false;
    service.listeners = [];
    service.availabilityListeners = [];
    service.availabilityCache = null;
    service.availabilityChecked = false;

    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  describe('toggleChat', () => {
    it('opens chat when closed', async () => {
      const result = await service.toggleChat();
      expect(service.isOpen).toBe(true);
      expect(service.isMinimized).toBe(false);
      expect(result).toBe(true);
    });

    it('minimizes chat when open and not minimized', async () => {
      service.isOpen = true;
      service.isMinimized = false;

      await service.toggleChat();

      expect(service.isOpen).toBe(true);
      expect(service.isMinimized).toBe(true);
    });

    it('restores chat when minimized', async () => {
      service.isOpen = true;
      service.isMinimized = true;

      await service.toggleChat();

      expect(service.isOpen).toBe(true);
      expect(service.isMinimized).toBe(false);
    });

    it('notifies listeners on toggle', async () => {
      const listener = jest.fn();
      service.addListener(listener);

      await service.toggleChat();

      expect(listener).toHaveBeenCalledWith(true, false);
    });
  });

  describe('openChat', () => {
    it('opens chat when closed', () => {
      service.openChat();
      expect(service.isOpen).toBe(true);
      expect(service.isMinimized).toBe(false);
    });

    it('restores chat when minimized', () => {
      service.isOpen = true;
      service.isMinimized = true;

      service.openChat();

      expect(service.isMinimized).toBe(false);
    });

    it('does not notify if already open and not minimized', () => {
      service.isOpen = true;
      service.isMinimized = false;
      const listener = jest.fn();
      service.addListener(listener);

      service.openChat();

      expect(listener).not.toHaveBeenCalled();
    });

  });

  describe('closeChat', () => {
    it('closes chat when open', () => {
      service.isOpen = true;
      service.closeChat();
      expect(service.isOpen).toBe(false);
      expect(service.isMinimized).toBe(false);
    });

    it('does not notify if already closed', () => {
      const listener = jest.fn();
      service.addListener(listener);

      service.closeChat();

      expect(listener).not.toHaveBeenCalled();
    });

  });

  describe('toggleMinimize', () => {
    it('toggles minimize when chat is open', () => {
      service.isOpen = true;

      service.toggleMinimize();
      expect(service.isMinimized).toBe(true);

      service.toggleMinimize();
      expect(service.isMinimized).toBe(false);
    });

    it('does nothing when chat is closed', () => {
      const listener = jest.fn();
      service.addListener(listener);

      service.toggleMinimize();

      expect(listener).not.toHaveBeenCalled();
      expect(service.isMinimized).toBe(false);
    });
  });

  describe('listeners', () => {
    it('adds and removes listeners', () => {
      const listener = jest.fn();
      service.addListener(listener);

      service.notifyListeners();
      expect(listener).toHaveBeenCalledTimes(1);

      service.removeListener(listener);
      service.notifyListeners();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not add duplicate listeners', () => {
      const listener = jest.fn();
      service.addListener(listener);
      service.addListener(listener);

      service.notifyListeners();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not add non-function listeners', () => {
      service.addListener('not-a-function');
      service.addListener(null);
      service.addListener(42);

      expect(service.listeners).toHaveLength(0);
    });

    it('handles listener errors gracefully', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const badListener = jest.fn(() => { throw new Error('listener error'); });
      const goodListener = jest.fn();

      service.addListener(badListener);
      service.addListener(goodListener);

      service.notifyListeners();

      expect(goodListener).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('removing non-existent listener is a no-op', () => {
      const listener = jest.fn();
      service.removeListener(listener);
      expect(service.listeners).toHaveLength(0);
    });
  });

  describe('availability listeners', () => {
    it('adds and removes availability listeners', () => {
      const listener = jest.fn();
      service.addAvailabilityListener(listener);

      service.notifyAvailabilityChange(true);
      expect(listener).toHaveBeenCalledWith(true);

      service.removeAvailabilityListener(listener);
      service.notifyAvailabilityChange(false);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not add duplicate availability listeners', () => {
      const listener = jest.fn();
      service.addAvailabilityListener(listener);
      service.addAvailabilityListener(listener);

      service.notifyAvailabilityChange(true);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('handles availability listener errors gracefully', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const badListener = jest.fn(() => { throw new Error('error'); });

      service.addAvailabilityListener(badListener);
      service.notifyAvailabilityChange(true);

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('isAvailable', () => {
    it('fetches availability on first call', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(true));

      const result = await service.isAvailable();

      expect(fetchMock).toHaveBeenCalledWith('/gateway/ai/api/assistant/availability');
      expect(result).toBe(true);
    });

    it('returns cached value on subsequent calls', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(true));

      await service.isAvailable();
      await service.isAvailable();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns false when fetch fails', async () => {
      fetchMock.mockRejectOnce(new Error('network error'));

      const result = await service.isAvailable();

      expect(result).toBe(false);
      expect(service.availabilityChecked).toBe(true);
    });

    it('returns false when response is not ok', async () => {
      fetchMock.mockResponseOnce('', { status: 500 });

      const result = await service.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('checkAvailability', () => {
    it('notifies false initially, then result', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(true));
      const listener = jest.fn();
      service.addAvailabilityListener(listener);

      await service.checkAvailability();

      expect(listener).toHaveBeenNthCalledWith(1, false);
      expect(listener).toHaveBeenNthCalledWith(2, true);
    });

    it('notifies false on error', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      service.isAvailable = jest.fn().mockRejectedValue(new Error('fail'));
      const listener = jest.fn();
      service.addAvailabilityListener(listener);

      const result = await service.checkAvailability();

      expect(result).toBe(false);
      expect(listener).toHaveBeenLastCalledWith(false);
      errorSpy.mockRestore();
    });
  });

  describe('handleSubmit', () => {
    it('delegates to editorContextService when context exists', () => {
      editorContextService.hasContext.mockReturnValue(true);
      editorContextService.callHandler.mockReturnValue('result');

      const result = service.handleSubmit({ text: 'hello' });

      expect(editorContextService.callHandler).toHaveBeenCalledWith('onSubmit', { text: 'hello' });
      expect(result).toBe('result');
    });

    it('returns null when no context', () => {
      editorContextService.hasContext.mockReturnValue(false);

      const result = service.handleSubmit({ text: 'hello' });

      expect(result).toBeNull();
    });
  });

  describe('isBpmnEditorPage', () => {
    const originalLocation = window.location;

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
      });
    });

    it('returns true for bpmn-editor URL', () => {
      delete window.location;
      window.location = { pathname: '/v2/bpmn-editor' };

      expect(service.isBpmnEditorPage()).toBe(true);
    });

    it('returns false for non-bpmn URL', () => {
      delete window.location;
      window.location = { pathname: '/v2/dashboard' };

      expect(service.isBpmnEditorPage()).toBe(false);
    });
  });
});
