import aiAssistantContext, { CONTEXT_TYPES } from './AIAssistantContext';
import aiAssistantService from './AIAssistantService';

/**
 * Extracts recordRef from URL
 * @returns {string|null} recordRef or null if not found
 */
const getRecordRefFromUrl = () => {
  const url = window.location.href;
  const recordRefMatch = url.match(/recordRef=([^&]+)/);
  return recordRefMatch ? decodeURIComponent(recordRefMatch[1]) : null;
};

/**
 * Checks if the current page is a document page and initializes
 * the AI assistant context accordingly
 */
const initDocumentQAContext = () => {
  if (aiAssistantService.isDocumentWithContent()) {
    const recordRef = getRecordRefFromUrl();

    if (recordRef && recordRef.includes('emodel/workspace-file@')) {
      // Set the context with the recordRef
      aiAssistantContext.setContext(
        CONTEXT_TYPES.DOCUMENT_QA,
        {}, // No special handlers needed for document QA
        { recordRef } // Store recordRef in context data
      );

      return true;
    }
  }

  // If this is not a document page or recordRef isn't valid, clear context if it was DOCUMENT_QA
  if (aiAssistantContext.hasContextType(CONTEXT_TYPES.DOCUMENT_QA)) {
    aiAssistantContext.clearContext();
  }

  return false;
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
