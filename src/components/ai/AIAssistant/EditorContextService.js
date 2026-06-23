// Lazy import breaks the AIAssistantService <-> EditorContextService circular dependency.
// `aiAssistantService` is only used at call-time (below), so deferring it is safe.
const checkAiAvailability = () => import('./AIAssistantService').then(({ default: service }) => service.checkAvailability());

export const CONTEXT_TYPES = {
  BPMN_EDITOR: 'BPMN_EDITOR',
  UNIVERSAL: 'UNIVERSAL'
};

class AIAssistantContext {
  constructor() {
    this.currentContext = null;
    this.contextHandlers = {};
    this.contextData = {};
  }

  setContext(contextType, handlers = {}, contextData = {}) {
    const wasContextEmpty = !this.currentContext;
    this.currentContext = contextType;
    this.contextHandlers[contextType] = handlers;
    this.contextData[contextType] = contextData;

    if (wasContextEmpty) {
      setTimeout(() => {
        checkAiAvailability();
      }, 100);
    }
  }

  clearContext() {
    const hadContext = !!this.currentContext;
    this.currentContext = null;

    if (hadContext) {
      checkAiAvailability();
    }
  }

  getContext() {
    return this.currentContext;
  }

  hasContext() {
    return !!this.currentContext;
  }

  hasContextType(contextType) {
    return this.currentContext === contextType;
  }

  getHandlers() {
    return this.currentContext ? this.contextHandlers[this.currentContext] || {} : {};
  }

  getHandler(handlerName) {
    const handlers = this.getHandlers();
    return handlers[handlerName];
  }

  callHandler(handlerName, ...args) {
    const handler = this.getHandler(handlerName);
    if (handler && typeof handler === 'function') {
      return handler(...args);
    }
    return null;
  }

  getContextData() {
    return this.currentContext ? this.contextData[this.currentContext] || {} : {};
  }

  updateContextData(data) {
    if (this.currentContext) {
      this.contextData[this.currentContext] = {
        ...this.contextData[this.currentContext],
        ...data
      };
    }
  }
}

const aiAssistantContext = new AIAssistantContext();
export default aiAssistantContext;
