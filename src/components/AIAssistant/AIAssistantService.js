import aiAssistantContext, { CONTEXT_TYPES } from './AIAssistantContext';
import Records from '../Records';

const BPMN_EDITOR_URL_PATTERN = /\/bpmn-editor/;

class AIAssistantService {
  constructor() {
    this.isOpen = false;
    this.isMinimized = false;
    this.listeners = [];
    this.availabilityListeners = [];
  }

  isBpmnEditorPage() {
    return BPMN_EDITOR_URL_PATTERN.test(window.location.pathname);
  }

  getRecordRefFromUrl() {
    const match = window.location.href.match(/recordRef=([\w-/]+@[\w-]+)/);
    return match ? match[1] : null;
  }

  async isDocumentWithContent() {
   try {
      const recordRef = this.getRecordRefFromUrl();
      if (!recordRef) {
        return false;
      }

      const hasContent = await Records.get(recordRef).load('_has._content?bool');
      return !!hasContent;
    } catch (error) {
      console.error('Error checking document content:', error);
      return false;
    }
  }

  async isAvailable() {
    if (this.isBpmnEditorPage()) {
      return aiAssistantContext.hasContext();
    }

    const hasContent = await this.isDocumentWithContent();
    return hasContent && aiAssistantContext.hasContext();
  }

  async toggleChat() {
    if (!this.isOpen) {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return false;
      }
    }

    if (!this.isOpen) {
      this.isOpen = true;
      this.isMinimized = false;
    } else if (!this.isMinimized) {
      this.isMinimized = true;
    } else {
      this.isMinimized = false;
    }

    this.notifyListeners();
    return this.isOpen;
  }

  closeChat() {
    if (this.isOpen) {
      this.isOpen = false;
      this.isMinimized = false;
      this.notifyListeners();
    }
    return false;
  }

  toggleMinimize() {
    if (this.isOpen) {
      this.isMinimized = !this.isMinimized;
      this.notifyListeners();
    }
    return this.isMinimized;
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
        listener(this.isOpen, this.isMinimized);
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

  async checkAvailability() {
    try {
      this.notifyAvailabilityChange(false);

      const isAvailable = await this.isAvailable();

      this.notifyAvailabilityChange(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('Error checking availability:', error);
      this.notifyAvailabilityChange(false);
      return false;
    }
  }
}

const aiAssistantService = new AIAssistantService();
export default aiAssistantService;
