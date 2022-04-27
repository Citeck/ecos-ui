import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import React, { useEffect, useRef, useState } from 'react';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';

import HeatmapWrapper from './tools/Heatmap.js';
import { Zooms } from './util';

export default class ModelViewer {
  static querySelector = 'ecos-model-container';
  modeler;
  heatmap;
  #defaultScale;
  #container;

  init = async ({ diagram, container, onInit, onMounted }) => {
    isFunction(onInit) && onInit(true);

    this.modeler = new NavigatedViewer({
      additionalModules: [
        //minimapModule, //diagram-js-minimap
        {
          //moveCanvas: ['value', ''], //destroy
          zoomScroll: ['value', ''] //destroy
        }
      ]
    });

    if (container) {
      this.#container = container;
      this.modeler.attachTo(container);
    }

    await this.setDiagram(diagram, { onMounted });
  };

  get canvas() {
    return this.modeler.get('canvas');
  }

  get viewport() {
    return this.modeler._container.querySelector('.viewport');
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

  setHeight = height => {
    if (this.#container) {
      height = height || this.viewport.getBoundingClientRect().height;
      this.#container.style.height = `${height}px`;
      this.setZoom(Zooms.FIT);
    }
  };

  setZoom = value => {
    let nv;
    switch (value) {
      case Zooms.DEFAULT:
        nv = this.#defaultScale;
        break;
      case Zooms.FIT:
        nv = Zooms.FIT;
        break;
      default: {
        let oldScale = this.canvas.viewbox().scale;
        oldScale = isNumber(oldScale) ? oldScale : this.#defaultScale;
        const newScale = oldScale + value;
        nv = newScale > Zooms.STEP ? newScale : Zooms.STEP;
      }
    }

    nv && this.canvas.zoom(nv);
    this.redrawHeatmap();
  };

  Sheet = ({ diagram, onMounted, onInit, defHeight }) => {
    const [initialized, setInitialized] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
      if (!initialized && get(containerRef, 'current')) {
        setInitialized(true);
        this.init({
          diagram,
          container: containerRef.current,
          onInit,
          onMounted
        });
      }
    }, [initialized, containerRef]);

    return <div ref={containerRef} style={{ height: `${defHeight}px` }} className={ModelViewer.querySelector} />;
  };

  /**
   * Draw Heatmap
   * @param data {Array}
   * @param hasTooltip {Boolean}
   * @param onChange {Function}
   * @param onMounted {Function}
   */
  drawHeatmap = ({ data = [], onChange, onMounted, hasTooltip }) => {
    this.heatmap = new HeatmapWrapper({ instModel: this.modeler, data, hasTooltip, onChange, onMounted });
  };

  redrawHeatmap = () => {
    if (!this.heatmap) {
      return;
    }
    this.heatmap.repaint();
  };

  drawInfoBlock = ({ data = [], getTemplateHtml }) => {
    const mapData = {};
    data && data.forEach(item => (mapData[item.id] = item));

    const elementRegistry = this.modeler.get('elementRegistry');
    const overlays = this.modeler.get('overlays');
    const nodes = elementRegistry
      .getAll()
      .filter(element => !!mapData[element.id] && !element.hidden && !element.waypoints && element.parent && element.type !== 'label');
    const { scale } = this.canvas.viewbox();

    nodes.forEach(node => {
      const item = mapData[node.id];

      if (item) {
        const element = elementRegistry.get(node.id);
        const { width } = element;

        overlays.add(node.id, 'note', {
          position: { right: 0, top: -20 },
          html: getTemplateHtml({ width: Math.floor(width * scale), data: item })
        });
      }
    });
  };

  destroy = () => {
    this.modeler && this.modeler._emit('diagram.destroy');
    this.heatmap && this.heatmap.destroy();
  };
}
