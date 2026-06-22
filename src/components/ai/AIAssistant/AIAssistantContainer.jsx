import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

import AIAssistantChat from './AIAssistantChat';

const AIAssistantContainer = () => {
  const containerRef = React.useRef(document.createElement('div'));

  useEffect(() => {
    document.body.appendChild(containerRef.current);

    return () => {
      document.body.removeChild(containerRef.current);
    };
  }, []);

  return ReactDOM.createPortal(
    <AIAssistantChat />,
    containerRef.current
  );
};

export default AIAssistantContainer;
