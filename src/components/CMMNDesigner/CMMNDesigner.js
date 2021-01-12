import React, { useEffect, useRef, useState } from 'react';
import CmmnModeler from 'cmmn-js/lib/Modeler';
import get from 'lodash/get';

import additionalModules from './modules';
import { initialDiagram } from './utils';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-codes.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-embedded.css';

export default class CMMNDesigner {
  static initialDiagram = initialDiagram;

  #isCustomContainer = false;
  #viewer = null;

  #init = async ({ diagram, container }) => {
    this.#viewer = new CmmnModeler({ additionalModules });

    if (container) {
      this.#viewer.attachTo(container);
    }

    this.setDiagram(diagram);
  };

  get isCustomContainer() {
    return this.#isCustomContainer;
  }

  setDiagram = diagram => {
    if (diagram) {
      this.#viewer.importXML(diagram, error => error && console.error('Error rendering', error));
    } else {
      console.warn('No diagram');
    }
  };

  saveXML = ({ callback }) => {
    if (!this.#viewer) {
      return;
    }

    try {
      this.#viewer.saveXML({ format: true }, (error, xml) => {
        if (error) {
          throw error;
        }

        callback && callback({ error, xml });
      });
    } catch (error) {
      console.error('Error saving XML', error);
      callback && callback({ error, xml: null });
    }
  };

  saveSVG = ({ callback }) => {
    if (!this.#viewer) {
      return;
    }

    try {
      this.#viewer.saveSVG({ format: true }, (error, svg) => {
        if (error) {
          throw error;
        }

        callback && callback({ svg });
      });
    } catch (error) {
      console.error('Error saving SVG', error);
      callback && callback({ error, svg: null });
    }
  };

  Sheet = ({ diagram }) => {
    const [initialized, setInitialized] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
      if (!initialized && get(containerRef, 'current')) {
        this.#init({ diagram, container: containerRef.current });
        setInitialized(true);
      }
    }, [initialized, containerRef]);

    return <div ref={containerRef} className="ecos-cmmn-container" />;
  };

  setCustomContainer = container => {
    this.#isCustomContainer = true;
    this.#viewer.attachTo(container);
  };
}
