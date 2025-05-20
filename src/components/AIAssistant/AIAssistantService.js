import aiAssistantContext, { CONTEXT_TYPES } from './AIAssistantContext';

const BPMN_EDITOR_URL_PATTERN = /\/bpmn-editor/;
const DOCUMENT_URL_PATTERN = /recordRef=emodel\/workspace-file@/;

class AIAssistantService {
  constructor() {
    this.isOpen = false;
    this.listeners = [];
    this.availabilityListeners = [];
  }

  isBpmnEditorPage() {
    return BPMN_EDITOR_URL_PATTERN.test(window.location.pathname);
  }

  // TODO: we should check, that document has _content
  isDocumentWithContent() {
    return DOCUMENT_URL_PATTERN.test(window.location.href);
  }

  isAvailable() {
    return (this.isBpmnEditorPage() || this.isDocumentWithContent()) && aiAssistantContext.hasContext();
  }

  toggleChat() {
    if (!this.isOpen && !this.isAvailable()) {
      return false;
    }

    this.isOpen = !this.isOpen;
    this.notifyListeners();
    return this.isOpen;
  }

  openChat() {
    if (!this.isOpen && !this.isAvailable()) {
      return false;
    }

    if (!this.isOpen) {
      this.isOpen = true;
      this.notifyListeners();
    }
    return true;
  }

  closeChat() {
    if (this.isOpen) {
      this.isOpen = false;
      this.notifyListeners();
    }
    return false;
  }

  handleSubmit(data) {
    if (aiAssistantContext.hasContext()) {
      return aiAssistantContext.callHandler('onSubmit', data);
    }
    return null;
  }

  addListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.isOpen);
      } catch (error) {
        console.error('Error in AIAssistant listener:', error);
      }
    });
  }

  addAvailabilityListener(listener) {
    if (typeof listener === 'function' && !this.availabilityListeners.includes(listener)) {
      this.availabilityListeners.push(listener);
    }
  }

  removeAvailabilityListener(listener) {
    const index = this.availabilityListeners.indexOf(listener);
    if (index !== -1) {
      this.availabilityListeners.splice(index, 1);
    }
  }

  notifyAvailabilityChange(isAvailable) {
    this.availabilityListeners.forEach(listener => {
      try {
        listener(isAvailable);
      } catch (error) {
        console.error('Error in AIAssistant availability listener:', error);
      }
    });
  }

  checkAvailability() {
    const isAvailable = this.isAvailable();
    this.notifyAvailabilityChange(isAvailable);
    return isAvailable;
  }
}

const aiAssistantService = new AIAssistantService();
export default aiAssistantService;
