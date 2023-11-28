import React, { useState, useRef, useEffect } from 'react';
import get from 'lodash/get';

export const Sheet = ({ diagram, sectionPath, onMounted, extraEvents, init, className, ...props }) => {
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
          sectionPath,
          container: containerRef.current,
          events,
          extraEvents,
          callback: res => onMounted(true, res)
        });
        setInitialized(true);
      }
    },
    [initialized, diagram, sectionPath, extraEvents, events, onMounted, containerRef]
  );

  return <div ref={containerRef} className={className} />;
};
