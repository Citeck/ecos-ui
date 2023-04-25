import React, { useState, useRef, useEffect } from 'react';
import get from 'lodash/get';
import BaseModeler from './BaseModeler';

export const Sheet = ({ diagram, onMounted, extraEvents, init, ...props }) => {
  const [initialized, setInitialized] = useState(false);
  const containerRef = useRef(null);
  const events = {};

  Object.keys(props)
    .filter(key => key.startsWith('on'))
    .forEach(key => (events[key] = props[key]));

  useEffect(
    () => {
      if (!initialized && get(containerRef, 'current')) {
        init({
          diagram,
          container: containerRef.current,
          events,
          extraEvents,
          callback: res => onMounted(true, res)
        });
        setInitialized(true);
      }
    },
    [initialized, diagram, extraEvents, events, onMounted, containerRef]
  );

  return <div ref={containerRef} className={BaseModeler.querySelector} />;
};
