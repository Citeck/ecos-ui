import Heatmap from 'heatmap.js';
import { isExpanded } from 'bpmn-js/lib/util/DiUtil';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import includes from 'lodash/includes';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';

import { normalize, t } from '../../../helpers/util';
import { Labels } from '../util';
import { getTaskShapePoints, getUnknownShapePoints } from './util';
import Tooltip from './Tooltip';
import EcosPlugin from './custom/ecosPlugin';

Heatmap.register('ecos', EcosPlugin);

const normalizedData = new Map();

export default class HeatmapWrapper {
  instance;
  origData;
  #instModel;
  #mapPoints;
  #container;
  #tooltip;

  constructor({ instModel, data, hasTooltip, onChange, onMounted }) {
    this.#instModel = instModel;
    this.origData = cloneDeep({ data, hasTooltip, onChange, onMounted });

    const info = this.getPreparedData({ data, onChange });

    this.draw({ info, onMounted });

    hasTooltip && this.drawTooltip();
  }

  destroy = () => {
    this.#tooltip && this.#tooltip.destroy();
    this.instance && this.instance._renderer.canvas.remove();
    this.instance = null;
    this.origData = null;
    this.#mapPoints = null;
    this.#instModel = null;
    this.#container.removeEventListener('mousemove', this.#onmousemove);
    this.#container.removeEventListener('mouseout', this.#onmouseout);
  };

  get canvas() {
    return get(this.instance, '_renderer.canvas');
  }

  get viewboxData() {
    if (!this.#instModel) {
      return {};
    }

    const viewbox = this.#instModel.get('canvas').viewbox();

    const {
      inner: { x: iX, y: iY, height: iH, width: iW },
      outer: { height: H, width: W },
      x: X,
      y: Y,
      scale // zoom rate
    } = viewbox;

    return { iX, iY, iH, iW, H, W, X, Y, scale };
  }

  repaint() {
    this._updateTransform();
    this.instance && this.instance.repaint();
  }

  _updateTransform() {
    const { scale, X, Y, W, H } = this.viewboxData;
    if (this.instance) {
      this.instance._renderer.setDimensions(+W, +H);
      this.instance._renderer.setOffsetAndScale(X, Y, scale);
    }
  }

  getPreparedData({ data, onChange }) {
    this.#mapPoints = {};
    const mapData = {};
    data && data.forEach(item => (mapData[item.id] = item));

    const shapePoints = [];
    const connectionPoints = [];
    const elementRegistry = this.#instModel.get('elementRegistry');
    const canvas = this.#instModel.get('canvas');
    const root = canvas.getRootElement();
    const { H, W } = this.viewboxData;

    const isVisible = element => {
      const { parent = {} } = element;

      if (parent.layer && parent.layer !== root.layer) {
        return false;
      }

      return !element.hidden && isExpanded(element);
    };

    // get all shapes and connections
    const shapes = elementRegistry.filter(element => isVisible(element) && !element.waypoints && element.type !== 'label');
    const connections = elementRegistry.filter(element => !!mapData[element.id] && isVisible(element) && !!element.waypoints);

    shapes.forEach(shape => {
      const { x, y, width, height, type, id } = shape;

      if (mapData[id]) {
        let fun;
        if (includes(type, 'Task')) {
          fun = getTaskShapePoints;
        } else {
          fun = getUnknownShapePoints;
        }

        const points = fun(x, y, width, height, mapData[id].value);
        this.#mapPoints[id] = points;
        shapePoints.push(...points);
      }
    });

    connections.forEach(con => {
      connectionPoints.push({
        line: con.waypoints.map(item => ({ x: Math.abs(item.x), y: Math.abs(item.y) })),
        value: get(mapData, [con.id, 'value']) || 0,
        radius: 13
      });
    });

    const points = shapePoints.concat(connectionPoints);
    const maxV = Math.max(...points.map(i => i.value));

    this.#container = canvas._container;

    const config = {
      container: this.#container,
      width: +W,
      height: +H,
      radius: 45,
      maxOpacity: 0.8,
      minOpacity: 0,
      blur: 0.75,
      plugin: 'ecos',
      onExtremaChange: data =>
        this.instance &&
        isFunction(onChange) &&
        onChange({
          ...data,
          min: 0,
          max: maxV
        })
    };

    const normalized = this.getNormalizedData(points);
    const normalizedValues = normalized.map(item => item.value);

    const heatmapData = {
      max: Math.max(...normalizedValues),
      min: Math.min(...normalizedValues),
      data: normalized
    };

    return { config, heatmapData };
  }

  getNormalizedData(data) {
    const key = JSON.stringify(data);
    let normalized;

    if (normalizedData.has(key)) {
      normalized = normalizedData.get(key);
    } else {
      normalized = normalize(data, 'value');
      normalizedData.set(key, normalized);
    }

    return normalized;
  }

  draw = ({ info, onMounted }) => {
    this.instance = Heatmap.create(info.config);
    this._updateTransform();
    this.instance.setData(info.heatmapData);
    isFunction(onMounted) && onMounted(true);
  };

  updateData = data => {
    const info = this.getPreparedData({ data });
    this.instance.setData(info.heatmapData);
  };

  toggleDisplay = isHidden => {
    this.canvas && this.canvas.classList.toggle('d-none', isHidden);
  };

  setOpacity = opacity => {
    this.canvas && (this.canvas.style.opacity = opacity);
  };

  drawTooltip = () => {
    this.#tooltip = new Tooltip();
    this.#tooltip.create(this.#container);
    this.#container.addEventListener('mousemove', this.#onmousemove);
    this.#container.addEventListener('mouseout', this.#onmouseout);
  };

  #onmousemove = ev => {
    const x = ev.layerX;
    const y = ev.layerY;
    const key = this.#mapPoints && Object.keys(this.#mapPoints).find(k => this.#mapPoints[k].find(point => point.x === x && point.y === y));
    const data = this.origData && this.origData.data.find(item => key === item.id);
    const text = data && !isNil(data.value) ? data.value : `${t(Labels.TIP_AVG_VAL)}: ${this.instance.getValueAt({ x, y })}`;

    this.#tooltip.draw({ hidden: false, text, coords: { x, y } });
  };

  #onmouseout = () => {
    this.#tooltip.draw({ hidden: true });
  };
}
