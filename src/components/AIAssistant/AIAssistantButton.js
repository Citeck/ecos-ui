import React, { useEffect, useState } from 'react';

import AiAssistant from '../common/icons/AiAssistant';
import aiAssistantService from './AIAssistantService';
import { IcoBtn } from '../common/btns';

import './style.scss';

const AIAssistantButton = () => {
  const [isAvailable, setIsAvailable] = useState(aiAssistantService.isAvailable());
  const [isOpen, setIsOpen] = useState(aiAssistantService.isOpen);
  const buttonId = 'ai-assistant-btn';

  // Check availability on URL change and context change
  useEffect(() => {
    const checkAvailability = () => {
      setIsAvailable(aiAssistantService.isAvailable());
    };

    checkAvailability();

    const handleStateChange = (newIsOpen) => {
      setIsOpen(newIsOpen);
    };

    const handleAvailabilityChange = (newIsAvailable) => {
      setIsAvailable(newIsAvailable);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      checkAvailability();
    };

    window.history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      checkAvailability();
    };

    window.addEventListener('popstate', checkAvailability);

    aiAssistantService.addListener(handleStateChange);
    aiAssistantService.addAvailabilityListener(handleAvailabilityChange);

    // Periodically check availability (in case the context has changed)
    const intervalId = setInterval(() => {
      aiAssistantService.checkAvailability();
    }, 1000);

    // Remove listeners when the component is unmounted
    return () => {
      window.removeEventListener('popstate', checkAvailability);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      aiAssistantService.removeListener(handleStateChange);
      aiAssistantService.removeAvailabilityListener(handleAvailabilityChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleClick = () => {
    aiAssistantService.toggleChat();
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <div className="ecos-model-editor__designer-ai-button">
      <IcoBtn
          id={buttonId}
          icon={<AiAssistant />}
          onClick={handleClick}
          className= 'ecos-btn_blue-classic'
        />
    </div>
  );
};

export default AIAssistantButton;
