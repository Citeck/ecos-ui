import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

import AIAssistantChat from './AIAssistantChat';
import aiAssistantService from './AIAssistantService';

const BPMN_EDITOR_URL_PATTERN = /\/bpmn-editor/;

const AIAssistantContainer = () => {
  const containerRef = React.useRef(document.createElement('div'));

  useEffect(() => {
    document.body.appendChild(containerRef.current);

    const handleVisibilityChange = () => {
      if (document.hidden && aiAssistantService.isOpen) {
        aiAssistantService.closeChat();
      }
    };

    const handleBeforeUnload = () => {
      if (aiAssistantService.isOpen) {
        aiAssistantService.closeChat();
      }
    };

    const handleLocationChange = () => {
      const isBpmnEditorPage = BPMN_EDITOR_URL_PATTERN.test(window.location.pathname);
      if (!isBpmnEditorPage && aiAssistantService.isOpen) {
        console.log('Закрываем чат, так как пользователь покинул страницу BPMN редактора');
        aiAssistantService.closeChat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      handleLocationChange();
    };

    window.history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      handleLocationChange();
    };

    window.addEventListener('popstate', handleLocationChange);

    handleLocationChange();

    return () => {
      document.body.removeChild(containerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleLocationChange);

      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return ReactDOM.createPortal(
    <AIAssistantChat />,
    containerRef.current
  );
};

export default AIAssistantContainer;
