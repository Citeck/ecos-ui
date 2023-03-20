import React, { useState, useRef, useEffect } from 'react';
import get from 'lodash/get';
import ModelViewer from './ModelViewer';

export const Sheet = ({ diagram, onMounted, onInit, defHeight, modelEvents, init, ...props }) => {
  const [initialized, setInitialized] = useState(false);
  const containerRef = useRef(null);
  const events = {};

  for (const key in props) {
    if (Object.hasOwnProperty.call(props, key) && key.startsWith('on')) {
      events[key] = props[key];
    }
  }

  useEffect(
    () => {
      if (!initialized && get(containerRef, 'current')) {
        setInitialized(true);
        init({
          diagram,
          container: containerRef.current,
          onInit,
          onMounted,
          modelEvents
        });
      }
    },
    [initialized, containerRef]
  );

  return <div ref={containerRef} style={{ height: `${defHeight}px` }} className={ModelViewer.querySelector} {...events} />;
};
