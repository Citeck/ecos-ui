import get from 'lodash/get';
import React, { useState, useRef, useEffect } from 'react';

import ModelViewer from './ModelViewer';

export const Sheet = ({
  diagram,
  sectionPath,
  onMounted,
  onInit,
  defHeight,
  modelEvents,
  init,
  markedElement,
  zoom,
  zoomCenter,
  setMarkedElement,
  className = ModelViewer.querySelector,
  ...props
}) => {
  const [initialized, setInitialized] = useState(false);
  const containerRef = useRef(null);
  const events = {};

  for (const key in props) {
    if (Object.hasOwnProperty.call(props, key) && key.startsWith('on')) {
      events[key] = props[key];
    }
  }

  useEffect(() => {
    if (!initialized && get(containerRef, 'current')) {
      setInitialized(true);
      init({
        diagram,
        sectionPath,
        container: containerRef.current,
        onInit,
        onMounted,
        modelEvents,
        markedElement,
        zoom,
        zoomCenter
      });
    }
  }, [initialized, containerRef, sectionPath]);

  useEffect(() => {
    if (markedElement) {
      setMarkedElement(markedElement);
    }
  }, [markedElement]);

  return <div ref={containerRef} style={{ height: `${defHeight}px` }} className={className} {...events} />;
};
