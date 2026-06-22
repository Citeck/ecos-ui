import editorContextService, { CONTEXT_TYPES } from './EditorContextService';
import aiAssistantService from './AIAssistantService';

const clearBPMNContext = () => {
  if (editorContextService.hasContextType(CONTEXT_TYPES.BPMN_EDITOR)) {
    editorContextService.clearContext();
  }
};

/**
 * Checks if the current page is a BPMN editor page and initializes
 * the AI assistant context accordingly
 */
const initBPMNContext = async () => {
  try {
    const isBPMNPage = aiAssistantService.isBpmnEditorPage();

    if (isBPMNPage) {
      // Only set context if not already set
      if (!editorContextService.hasContextType(CONTEXT_TYPES.BPMN_EDITOR)) {
        // Context will be set by the BPMN editor component itself
        // This is just for cleanup when navigating away
      }
      return true;
    }

    // If this is not a BPMN page, clear context
    clearBPMNContext();

    return false;
  } catch (error) {
    console.error('Error initializing BPMN context:', error);

    clearBPMNContext();
    return false;
  }
};

// Store cleanup resources
let bpmnContextIntervalId = null;
let popstateHandler = null;

const setupBPMNContextObserver = () => {
  // Clean up previous observer if exists
  cleanupBPMNContextObserver();

  // Initial check
  initBPMNContext();

  // Listen for URL changes
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(initBPMNContext, 100);
  };

  window.history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    setTimeout(initBPMNContext, 100);
  };

  popstateHandler = () => {
    setTimeout(initBPMNContext, 100);
  };
  window.addEventListener('popstate', popstateHandler);

  // Periodic check (in case other mechanisms change the URL)
  bpmnContextIntervalId = setInterval(initBPMNContext, 1000);
};

const cleanupBPMNContextObserver = () => {
  if (bpmnContextIntervalId) {
    clearInterval(bpmnContextIntervalId);
    bpmnContextIntervalId = null;
  }
  if (popstateHandler) {
    window.removeEventListener('popstate', popstateHandler);
    popstateHandler = null;
  }
};

export { initBPMNContext, setupBPMNContextObserver, cleanupBPMNContextObserver };
