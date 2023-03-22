import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import React, { useEffect, useRef, useState } from 'react';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';
import { isExpanded } from 'bpmn-js/lib/util/DiUtil';

import { ScaleOptions } from '../common/Scaler/util';
import BaseModeler from '../ModelEditor/BaseModeler';
import plugins from '../../../src/plugins';
import ecosTask from '../ModelEditor/BPMNModeler/moddle/ecosTask.json';
import { onlyRenderer } from '../ModelEditor/BPMNModeler/modules';

const _extendModeler = new BaseModeler();

export default class ModelViewer {
  static querySelector = 'ecos-model-container';
  modeler;
  heatmap;
  #defaultScale;
  #container;
  #badges;

  init = async ({ diagram, container, onInit, onMounted, modelEvents }) => {
    isFunction(onInit) && onInit(true);

    this.modeler = new NavigatedViewer({
      moddleExtensions: {
        ecosTask: ecosTask
      },
      additionalModules: [onlyRenderer]
    });

    if (container) {
      this.#container = container;
      this.modeler.attachTo(container);
    }

    await this.setDiagram(diagram, { onMounted });
    this.setEvents({}, modelEvents);
  };

  get canvas() {
    return this.modeler && this.modeler.get('canvas');
  }

  get viewport() {
    return this.modeler && this.modeler._container.querySelector('.viewport');
  }

  setDiagram = async (diagram, { onMounted }) => {
    let callbackData;
    try {
      if (this.modeler && diagram) {
        const result = await this.modeler.importXML(diagram);
        callbackData = { mounted: !result.error, result };
        this.#defaultScale = this.canvas.viewbox().scale;
      } else {
        callbackData = { mounted: false, error: 'No diagram' };
      }
    } catch (error) {
      console.error('Error rendering', error.message);
      callbackData = { mounted: false, error };
    }

    isFunction(onMounted) && onMounted(callbackData);
  };

  setEvents = _extendModeler.setEvents.bind(this);

  setHeight = height => {
    if (this.#container) {
      height = height || this.viewport.getBoundingClientRect().height;
      this.#container.style.height = `${height}px`;
      this.setZoom(ScaleOptions.FIT);
    }
  };

  setZoom = value => {
    let nv;
    switch (value) {
      case ScaleOptions.DEFAULT:
        nv = this.#defaultScale;
        break;
      case ScaleOptions.FIT:
        nv = ScaleOptions.FIT;
        break;
      default: {
        let oldScale = this.canvas.viewbox().scale;
        oldScale = isNumber(oldScale) ? oldScale : this.#defaultScale;
        const newScale = oldScale + value;
        nv = newScale > ScaleOptions.STEP ? newScale : ScaleOptions.STEP;
      }
    }

    nv && this.canvas.zoom(nv);
    this.redrawHeatmap();
  };

  Sheet = ({ diagram, onMounted, onInit, defHeight, modelEvents, ...props }) => {
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
        this.init({
          diagram,
          container: containerRef.current,
          onInit,
          onMounted,
          modelEvents
        });
      }
    }, [initialized, containerRef]);

    return <div ref={containerRef} style={{ height: `${defHeight}px` }} className={ModelViewer.querySelector} {...events} />;
  };

  /**
   * Draw Heatmap
   * @param data {Array}
   * @param hasTooltip {Boolean}
   * @param onChange {Function}
   * @param onMounted {Function}
   */
  drawHeatmap = ({ data = [], onChange, onMounted, hasTooltip }) => {
    const { HeatmapWrapper } = plugins;

    if (HeatmapWrapper) {
      this.heatmap = new HeatmapWrapper({ instModel: this.modeler, data, hasTooltip, onChange, onMounted });
    }
  };

  redrawHeatmap = () => {
    if (!this.heatmap) {
      return;
    }
    this.heatmap.repaint();
  };

  drawBadges = ({ data = [], keys = [] }) => {
    const { Badges } = plugins;

    if (!Badges) {
      return;
    }

    const elementRegistry = this.modeler.get('elementRegistry');
    const canvas = this.modeler.get('canvas');
    const root = canvas.getRootElement();

    const _data =
      data &&
      data.filter(item => {
        const element = elementRegistry.get(item.id);
        const parent = get(element, 'parent') || {};

        if (parent.layer && parent.layer !== root.layer) {
          return false;
        }

        return element && !element.hidden && isExpanded(element);
      });

    if (!this.#badges) {
      this.#badges = new Badges();
      this.#badges.create(this.modeler.get('overlays'));
    }

    this.#badges.draw({ data: _data, keys });
  };

  destroy = () => {
    this.modeler && this.modeler._emit('diagram.destroy');
    this.heatmap && this.heatmap.destroy();
    this.#badges && this.#badges.destroy();
  };
}
