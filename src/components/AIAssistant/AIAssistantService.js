import aiAssistantContext from "./AIAssistantContext";

const BPMN_EDITOR_URL_PATTERN = /\/bpmn-editor/;

class AIAssistantService {
  constructor() {
    this.isOpen = false;
    this.isMinimized = false;
    this.listeners = [];
    this.availabilityListeners = [];
    this.availabilityCache = null;
    this.availabilityChecked = false;
  }

  isBpmnEditorPage() {
    return BPMN_EDITOR_URL_PATTERN.test(window.location.pathname);
  }

  checkAssistantAvailability = () => {
    return fetch("/gateway/ai/api/assistant/availability")
      .then(res => res.ok ? res.json() : false)
      .catch(() => false)
  };

  async isAvailable() {
    if (this.availabilityChecked) {
      return this.availabilityCache;
    }

    try {
      this.availabilityCache = await this.checkAssistantAvailability();
    } catch (error) {
      console.error("Error checking assistant availability:", error);
      this.availabilityCache = false;
    }

    this.availabilityChecked = true;
    return this.availabilityCache;
  }

  async toggleChat() {
    // Always allow opening the chat - universal assistant is always available
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
      return aiAssistantContext.callHandler("onSubmit", data);
    }
    return null;
  }

  addListener(listener) {
    if (typeof listener === "function" && !this.listeners.includes(listener)) {
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
        console.error("Error in AIAssistant listener:", error);
      }
    });
  }

  addAvailabilityListener(listener) {
    if (typeof listener === "function" && !this.availabilityListeners.includes(listener)) {
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
        console.error("Error in AIAssistant availability listener:", error);
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
      console.error("Error checking availability:", error);
      this.notifyAvailabilityChange(false);
      return false;
    }
  }
}

const aiAssistantService = new AIAssistantService();
export default aiAssistantService;
