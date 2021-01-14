import React, { useEffect, useRef, useState } from 'react';
import Modeler from 'cmmn-js/lib/Modeler';
import get from 'lodash/get';

import additionalModules from './modules';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-codes.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-embedded.css';

/**
 * Expansion for Modeler
 * @class
 *
 * @param {Modeler} viewer - shows whose container is. You can set using setCustomContainer
 * @param {Object} events - custom events for objects of model
 * Available events: onSelectElement, onChangeElement, onClickElement
 * @param {Boolean} isCustomContainer - shows whose container is. You can set using setCustomContainer
 */
export default class CMMNDesigner {
  #modeler = null;
  #events = null;
  #isCustomContainer = false;

  /**
   * @constructor
   * @param {String} diagram - initial xml diagram
   * @param container - html element where diagram draws
   * @param {Object} events - any events you want to use.
   */
  #init = async ({ diagram, container, events }) => {
    this.#modeler = new Modeler({ additionalModules });

    if (container) {
      this.#modeler.attachTo(container);
    }

    this.setDiagram(diagram);
    this.setEvents(events);
  };

  get isCustomContainer() {
    return this.#isCustomContainer;
  }

  setDiagram = diagram => {
    if (this.#modeler && diagram) {
      this.#modeler.importXML(diagram, error => error && console.error('Error rendering', error));
    } else {
      console.warn('No diagram');
    }
  };

  setEvents = events => {
    // unsubscribe for added events in this.destroy below

    if (this.#modeler && events) {
      this.#events = events;

      events.onSelectElement &&
        this.#modeler.on('selection.changed', e => {
          if (get(e, 'newSelection.length', 0) < 2) {
            events.onSelectElement(get(e, 'newSelection[0]'));
          }
        });
      events.onChangeElement && this.#modeler.on('element.changed', e => events.onChangeElement(get(e, 'element')));
      events.onClickElement && this.#modeler.on('element.click', e => events.onClickElement(get(e, 'element')));
    }
  };

  updateProp = (element, prop, value) => {
    const modeling = this.#modeler.get('modeling');
    modeling.updateProperties(element, {
      [prop]: value
    });
    // if (prop === 'name') {
    //   modeling.updateLabel(element, value);
    // } else {
    //   modeling.updateProperties(element, {
    //     ['custom:' + prop]: value
    //   });
    // }
  };

  setCustomContainer = container => {
    this.#isCustomContainer = true;
    this.#modeler.attachTo(container);
  };

  /**
   * Return current diagram as XML
   * @param callback - use it to get xml or error
   */
  saveXML = ({ callback }) => {
    if (!this.#modeler) {
      return;
    }

    try {
      this.#modeler.saveXML({ format: true }, (error, xml) => {
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

  /**
   * Return current diagram as SVG
   * @param callback - use it to get svg or error
   */
  saveSVG = ({ callback }) => {
    if (!this.#modeler) {
      return;
    }

    try {
      this.#modeler.saveSVG({ format: true }, (error, svg) => {
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

  /**
   * Own component-container for drawing diagram
   * @param {String} xml diagram
   * see available events
   * @return {ReactComponent}
   */
  Sheet = ({ diagram, ...props }) => {
    const [initialized, setInitialized] = useState(false);
    const containerRef = useRef(null);
    const events = {};

    Object.keys(props)
      .filter(key => key.startsWith('on'))
      .forEach(key => (events[key] = props[key]));

    useEffect(() => {
      if (!initialized && get(containerRef, 'current')) {
        this.#init({ diagram, container: containerRef.current, events });
        setInitialized(true);
      }
    }, [initialized, containerRef]);

    return <div ref={containerRef} className="ecos-cmmn-container" />;
  };

  destroy = () => {
    if (this.#events) {
      this.#events.onSelectElement && this.#modeler.off('selection.changed', this.#events.onSelectElement);
    }
  };
}
