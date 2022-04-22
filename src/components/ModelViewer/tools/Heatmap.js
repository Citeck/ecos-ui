import Heatmap from 'heatmap.js';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import includes from 'lodash/includes';
import isFunction from 'lodash/isFunction';

import { getTaskShapePoints, getUnknownShapePoints } from './util';
import { HeatTooltip } from './';

export default class HeatmapWrapper {
  instance;
  #instModel;
  #origData;
  #mapData;

  constructor({ instModel, data, hasTooltip, onChange, onMounted }) {
    this.#instModel = instModel;

    const info = this.getData({ data, onChange });

    this.draw({ info, onMounted });
    hasTooltip && this.drawTooltip();
  }

  get canvas() {
    return get(this.instance, '_renderer.canvas');
  }

  get viewboxData() {
    const viewbox = this.#instModel.get('canvas').viewbox();

    const {
      inner: { x: oX, y: oY },
      outer: { height: H, width: W },
      x: X,
      y: Y,
      scale // zoom rate
    } = viewbox;

    return { oX, oY, H, W, X, Y, scale };
  }

  getData({ data, onChange }) {
    this.#origData = cloneDeep(data);
    this.#mapData = {};

    const shapePoints = [];
    const connectionPoints = [];
    const elementRegistry = this.#instModel.get('elementRegistry');
    const canvas = this.#instModel.get('canvas');
    const { oX, oY, H, W, X, Y, scale } = this.viewboxData;
    // get viewbox position & scale

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
          let fun;
          if (includes(type, 'Task')) {
            fun = getTaskShapePoints;
          } else {
            fun = getUnknownShapePoints;
          }

          const points = fun(shapeX, shapeY, shapeW, shapeH, heat.value);
          this.#mapData[heat.id] = points;
          shapePoints.push(...points);
        }
      });
    });

    connections.forEach(connection => {
      canvas.addMarker(connection.id, 'connection-shadow');
    });

    const points = shapePoints.concat(connectionPoints);

    const config = {
      container: this.#instModel._container,
      width: +W + (X < 0 ? Math.round(+((X - oX) * scale)) : X > 0 ? -(X - oX) * scale : 0),
      height: +H + (Y > 0 ? Math.round(+((Y - oY) * scale)) : 0),
      radius: 46,
      maxOpacity: 0.8,
      minOpacity: 0,
      blur: 0.75,
      onExtremaChange: data => isFunction(onChange) && onChange(data)
    };

    const values = points.map(item => item.value);
    const maxV = Math.max(...values);
    const heatmapData = { max: maxV, data: points };

    return { config, heatmapData };
  }

  draw = ({ info, onMounted }) => {
    //const { oX, oY, X, Y, scale } = this.viewboxData;

    this.instance = Heatmap.create(info.config);

    //todo
    // document.querySelector('.heatmap-canvas').setAttribute(
    //   'style',
    //   `
    //       position: absolute;
    //       left: ${X < 0 ? -((X - oX) * scale) : X > 0 ? -(X - oX) * scale : 0}px;
    //       top: ${Y > 0 ? -((Y - oY) * scale) : 0}px
    //     `
    // );

    // heatmapInstance.repaint();
    this.instance.setData(info.heatmapData);

    isFunction(onMounted) && onMounted(true);
  };

  updateData = ({ data }) => {
    const info = this.getData({ data });
    this.instance.setData(info.heatmapData);
  };

  toggleDisplay = isHidden => {
    this.canvas && this.canvas.classList.toggle('d-none', isHidden);
  };

  setOpacity = val => {
    this.canvas && (this.canvas.style.opacity = val);
  };

  //todo
  drawTooltip = () => {
    const container = this.#instModel._container;
    this.tooltip = HeatTooltip(container);

    container.onmousemove = ev => {
      const x = ev.layerX;
      const y = ev.layerY;
      // getValueAt gives us the value for a point p(x/y)
      const value = this.instance.getValueAt({ x, y });
      const key = Object.keys(this.#mapData).find(k => this.#mapData[k].find(point => point.x === x && point.y === y));
      const data = this.#origData.find(item => key === item.id);
      console.log(data);
      this.tooltip.setHidden(false);
      this.tooltip.setText(`medium: ${value}`);
      this.tooltip.setPlace(x, y);
    };

    container.onmouseout = () => {
      this.tooltip.setHidden(true);
    };

    console.log(this.tooltip);
  };
}
