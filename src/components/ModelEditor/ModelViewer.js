import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import heatmap from 'heatmap.js';
import React, { useEffect, useRef, useState } from 'react';
import get from 'lodash/get';
import includes from 'lodash/includes';
import isFunction from 'lodash/isFunction';

import { getTaskShapePoints, getUnknownShapePoints } from './heatmap/util';

export default class ModelViewer {
  static querySelector = 'ecos-model-container';
  modeler;
  heatmap;

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

  setDiagram = async (diagram, { onMounted }) => {
    let callbackData;
    try {
      if (this.modeler && diagram) {
        const result = await this.modeler.importXML(diagram);
        callbackData = { mounted: !result.error, result };
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
      if (height) {
        this.modeler._container.style.height = `${height}px`;
      }
      this.modeler.get('canvas').zoom('fit-viewport');
    }
  };

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

  drawHeatmap = ({ data, onChange, onMounted }) => {
    const shapePoints = [];
    const connectionPoints = [];
    const canvas = this.modeler.get('canvas');
    const elementRegistry = this.modeler.get('elementRegistry');
    const viewbox = canvas.viewbox();

    // get viewbox position & scale
    const {
      inner: { x: oX, y: oY },
      outer: { height: H, width: W },
      x: X,
      y: Y,
      scale // zoom rate
    } = viewbox;

    // get all shapes and connections
    const shapes = elementRegistry.filter(element => !element.waypoints && element.parent && element.type !== 'label');
    const connections = elementRegistry.filter(element => !!element.waypoints && element.parent);

    shapes.forEach(shape => {
      const { x, y, width: w, height: h, type, id } = shape;
      const shapeX = x * scale - X * scale + (X < 0 ? (X - oX) * scale : X > 0 ? (X - oX) * scale : 0);
      const shapeY = y * scale - Y * scale + (Y > 0 ? (Y - oY) * scale : 0);
      const shapeW = w * scale;
      const shapeH = h * scale;

      data.forEach(heat => {
        if (id === heat.id) {
          if (includes(type, 'Task')) {
            shapePoints.push(...getTaskShapePoints(shapeX, shapeY, shapeW, shapeH, heat.value));
          } else {
            shapePoints.push(...getUnknownShapePoints(shapeX, shapeY, shapeW, shapeH, heat.value));
          }
        }
      });
    });

    connections.forEach(connection => {
      canvas.addMarker(connection.id, 'connection-shadow');
    });

    const points = shapePoints.concat(connectionPoints);

    if (points.length) {
      const values = points.map(item => item.value);
      const maxV = Math.max(...values);

      const config = {
        container: this.modeler._container,
        width: +W + (X < 0 ? Math.round(+((X - oX) * scale)) : X > 0 ? -(X - oX) * scale : 0),
        height: +H + (Y > 0 ? Math.round(+((Y - oY) * scale)) : 0),
        radius: 46,
        maxOpacity: 0.8,
        minOpacity: 0,
        blur: 0.75,
        onExtremaChange: data => isFunction(onChange) && onChange(data)
      };

      const heatmapData = {
        max: maxV,
        data: points
      };

      this.heatmap = heatmap.create(config);

      //todo
      // document.querySelector('.heatmap-canvas').setAttribute(
      //   'style',
      //   `
      //     position: absolute;
      //     left: ${X < 0 ? -((X - oX) * scale) : X > 0 ? -(X - oX) * scale : 0}px;
      //     top: ${Y > 0 ? -((Y - oY) * scale) : 0}px
      //   `
      // );

      // heatmapInstance.repaint();
      this.heatmap.setData(heatmapData);

      isFunction(onMounted) && onMounted(true);
    }
  };

  toggleDisplayHeatmap = isHidden => {
    const canvas = get(this.heatmap, '_renderer.canvas');
    if (canvas) {
      canvas.classList.toggle('d-none', isHidden);
    }
  };

  destroy = () => {
    this.modeler && this.modeler._emit('diagram.destroy');
  };
}
