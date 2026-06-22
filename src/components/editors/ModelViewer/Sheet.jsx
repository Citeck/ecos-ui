import get from 'lodash/get';
import React, { useRef, useEffect } from 'react';

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
  const initializedRef = useRef(false);
  const containerRef = useRef(null);
  const events = {};

  for (const key in props) {
    if (Object.hasOwnProperty.call(props, key) && key.startsWith('on')) {
      events[key] = props[key];
    }
  }

  useEffect(() => {
    if (!initializedRef.current && get(containerRef, 'current')) {
      initializedRef.current = true;
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
  }, [sectionPath]);

  useEffect(() => {
    if (markedElement) {
      setMarkedElement(markedElement);
    }
  }, [markedElement]);

  return <div ref={containerRef} style={{ height: `${defHeight}px` }} className={className} {...events} />;
};
