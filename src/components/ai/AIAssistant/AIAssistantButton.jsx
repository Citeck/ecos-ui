import React, { useEffect, useState } from 'react';

import aiAssistantService from './AIAssistantService';

import { IcoBtn } from '@/components/common/btns';
import AiAssistant from '@/components/common/icons/global/AiAssistant';
import { t } from '@/helpers/export/util';

import './styles/index.scss';

const AIAssistantButton = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isOpen, setIsOpen] = useState(aiAssistantService.isOpen);
  const [isLoading, setIsLoading] = useState(true);
  const buttonId = 'ai-assistant-btn';

  useEffect(() => {
    const checkAvailability = async () => {
      setIsLoading(true);
      const available = await aiAssistantService.isAvailable();
      setIsAvailable(available);
      setIsLoading(false);
    };

    checkAvailability();

    const handleStateChange = (newIsOpen, newIsMinimized) => {
      setIsOpen(newIsOpen);
    };

    const handleAvailabilityChange = newIsAvailable => {
      setIsAvailable(newIsAvailable);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function () {
      originalPushState.apply(this, arguments);
      checkAvailability();
    };

    window.history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      checkAvailability();
    };

    window.addEventListener('popstate', checkAvailability);

    aiAssistantService.addListener(handleStateChange);
    aiAssistantService.addAvailabilityListener(handleAvailabilityChange);

    // Periodically check availability (in case the context has changed)
    const intervalId = setInterval(() => {
      aiAssistantService.checkAvailability();
    }, 5000);

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

  if (isLoading || !isAvailable) {
    return null;
  }

  return (
    <div className="ecos-model-editor__designer-ai-button">
      {/* title is kept alongside aria-label: IcoBtn has no styled tooltip of its own,
          so the browser tooltip is the only one and there is no risk of doubling */}
      <IcoBtn
        id={buttonId}
        icon={<AiAssistant color="#ffffff" />}
        onClick={handleClick}
        className="ecos-btn_blue-classic"
        aria-label={t('ai-assistant.button.open')}
        title={t('ai-assistant.button.open')}
      />
    </div>
  );
};

export default AIAssistantButton;
