import React, { useEffect, useRef, useState } from 'react';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

/**
 * Expansion for Modeler
 * @class
 *
 * @param {Modeler} viewer - shows whose container is. You can set using setCustomContainer
 * @param {Object} events - custom events for objects of model
 * Available events: onSelectElement, onChangeElement, onClickElement
 * @param {Boolean} isCustomContainer - shows whose container is. You can set using setCustomContainer
 */
export default class BaseModeler {
  static querySelector = 'ecos-model-container';

  modeler;
  events = {};
  _isCustomContainer = false;
  _isDiagramMounted = false;

  initModelerInstance = () => {
    this.modeler = null;
  };

  /**
   * @constructor
   * @param {String} diagram - initial xml diagram
   * @param container - html element where diagram draws
   * @param {Object} events - any events you want to use.
   * @param {Function} callback
   */
  init = async ({ diagram, container, events, callback }) => {
    this.initModelerInstance();

    if (container) {
      this.modeler.attachTo(container);
    }

    await this.setDiagram(diagram, { callback });
    this.setEvents(events);
  };

  get elementDefinitions() {
    return null;
  }

  get isCustomContainer() {
    return this._isCustomContainer;
  }

  get isDiagramMounted() {
    return this._isDiagramMounted;
  }

  getEventBus() {
    return this.modeler.get('eventBus');
  }

  setDiagram = async (diagram, { callback }) => {
    try {
      if (this.modeler && diagram) {
        const result = await this.modeler.importXML(diagram);
        const { warnings } = result || {};

        this._isDiagramMounted = true;
        isFunction(callback) && callback({ mounted: !!this.isDiagramMounted, warnings });
        !!warnings.length && console.warn(warnings);
      } else {
        console.error('No diagram', diagram);
      }
    } catch (err) {
      console.error('Error rendering', err.message, err.warnings);
    }
  };

  setEvents = events => {
    // unsubscribe for added events in this.destroy below

    if (this.modeler && events) {
      this.events = {};

      if (events.onSelectElement) {
        this.events.onSelectElement = e => {
          if (get(e, 'newSelection.length', 0) < 2) {
            events.onSelectElement(get(e, 'newSelection[0]'));
          }
        };
        this.modeler.on('selection.changed', this.events.onSelectElement);
      }

      if (events.onChangeElement) {
        this.events.onChangeElement = e => events.onChangeElement(get(e, 'element'));
        this.modeler.on('element.changed', this.events.onChangeElement);
      }

      if (events.onClickElement) {
        this.events.onClickElement = e => events.onClickElement(get(e, 'element'));
        this.modeler.on('element.click', this.events.onClickElement);
      }
    }
  };

  updateProps = (element, properties) => {
    const { name, ...data } = properties;

    if (name) {
      const labelEditingProvider = this.modeler.get('labelEditingProvider');
      labelEditingProvider.update(element, name);
    }

    if (data) {
      const modeling = this.modeler.get('modeling');
      modeling.updateProperties(element, data);
    }
  };

  setCustomContainer = container => {
    this._isCustomContainer = true;
    this.modeler.attachTo(container);
  };

  /**
   * Return current diagram as XML
   * @param callback - use it to get xml or error
   */
  saveXML = ({ callback }) => {
    if (!this.modeler) {
      return;
    }

    try {
      this.modeler.saveXML({ format: true }, (error, xml) => {
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
    if (!this.modeler) {
      return;
    }

    try {
      this.modeler.saveSVG({ format: true }, (error, svg) => {
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
  Sheet = ({ diagram, onMounted, ...props }) => {
    const [initialized, setInitialized] = useState(false);
    const containerRef = useRef(null);
    const events = {};

    Object.keys(props)
      .filter(key => key.startsWith('on'))
      .forEach(key => (events[key] = props[key]));

    useEffect(() => {
      if (!initialized && get(containerRef, 'current')) {
        setInitialized(true);
        this.init({
          diagram,
          container: containerRef.current,
          events,
          callback: res => onMounted(true, res)
        });
      }
    }, [initialized, containerRef]);

    return <div ref={containerRef} className={BaseModeler.querySelector} />;
  };

  destroy = () => {
    if (this.events) {
      this.events.onSelectElement && this.modeler.off('selection.changed', this.events.onSelectElement);
      this.events.onChangeElement && this.modeler.on('element.changed', this.events.onChangeElement);
      this.events.onClickElement && this.modeler.on('element.click', this.events.onClickElement);
    }

    this.modeler && this.modeler._emit('diagram.destroy');
  };
}
