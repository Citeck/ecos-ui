import aiAssistantContext, { CONTEXT_TYPES } from './AIAssistantContext';
import aiAssistantService from './AIAssistantService';

/**
 * Clears document QA context if it's currently active
 */
const clearDocumentQAContext = () => {
  if (aiAssistantContext.hasContextType(CONTEXT_TYPES.DOCUMENT_QA)) {
    aiAssistantContext.clearContext();
  }
};

/**
 * Checks if the current page is a document page and initializes
 * the AI assistant context accordingly
 */
const initDocumentQAContext = async () => {
  try {
    const hasContent = await aiAssistantService.isDocumentWithContent();

    if (hasContent) {
      const recordRef = aiAssistantService.getRecordRefFromUrl();

      if (recordRef) {
        aiAssistantContext.setContext(
          CONTEXT_TYPES.DOCUMENT_QA,
          {}, // No special handlers needed for document QA
          { recordRef }
        );

        return true;
      }
    }

    // If this is not a document page or recordRef isn't valid, clear context
    clearDocumentQAContext();

    return false;
  } catch (error) {
    console.error('Error initializing document QA context:', error);

    clearDocumentQAContext();
    return false;
  }
};

// Check context on load and on URL changes
const setupDocumentQAContextObserver = () => {
  // Initial check
  initDocumentQAContext();

  // Listen for URL changes
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function() {
    originalPushState.apply(this, arguments);
    initDocumentQAContext();
  };

  window.history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    initDocumentQAContext();
  };

  window.addEventListener('popstate', initDocumentQAContext);

  // Periodic check (in case other mechanisms change the URL)
  setInterval(initDocumentQAContext, 1000);
};

export { initDocumentQAContext, setupDocumentQAContextObserver };
