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
  defaultScale;

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
        this.defaultScale = this.canvas.viewbox().scale;
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
    if (this.modeler._container) {
      height = height || this.viewport.getBoundingClientRect().height;
      this.modeler._container.style.height = `${height}px`;

      this.canvas.zoom(Zooms.FIT);
    }
  };

  setZoom = value => {
    let nv;
    switch (value) {
      case Zooms.DEFAULT:
        nv = this.defaultScale;
        break;
      case Zooms.FIT:
        nv = Zooms.FIT;
        break;
      default: {
        let oldScale = this.canvas.viewbox().scale;
        oldScale = isNumber(oldScale) ? oldScale : this.defaultScale;
        const newScale = oldScale + value;
        nv = newScale > Zooms.STEP ? newScale : Zooms.STEP;
        //if (query('.tools-canvas')) remove(query('.tools-canvas'));
        //this.renderHeatmap(JSON.parse(JSON.stringify(heatmapdata)), canvas);
        //this.renderHeatmap(canvas);
      }
    }

    nv && this.canvas.zoom(nv);
    // nv && this.heatmap && this.heatmap.canvas.zoom(nv);
  };

  //todo tooltip

  Sheet = ({ diagram, onMounted, onInit }) => {
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

    return <div ref={containerRef} className={ModelViewer.querySelector} />;
  };

  /**
   * Draw Heatmap
   * @param data
   * @param onChange
   * @param onMounted
   */
  drawHeatmap = ({ data, onChange, onMounted }) => {
    this.heatmap = new HeatmapWrapper({ instModel: this.modeler, data, onChange, onMounted });
  };

  destroy = () => {
    this.modeler && this.modeler._emit('diagram.destroy');
  };
}
