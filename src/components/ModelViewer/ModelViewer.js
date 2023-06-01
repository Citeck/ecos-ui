import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import React from 'react';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';
import { isExpanded } from 'bpmn-js/lib/util/DiUtil';

import { ScaleOptions } from '../common/Scaler/util';
import BaseModeler from '../ModelEditor/BaseModeler';
import plugins from '../../../src/plugins';
import ecosTask from '../ModelEditor/BPMNModeler/moddle/ecosTask.json';
import { onlyRenderer } from '../ModelEditor/BPMNModeler/modules';
import { Sheet } from './Sheet';

const _extendModeler = new BaseModeler();

export default class ModelViewer {
  static querySelector = 'ecos-model-container';
  container;
  modeler;
  heatmap;
  #defaultScale;
  #badges;

  init = async ({ diagram, container, onInit, onMounted, modelEvents, markedElement }) => {
    isFunction(onInit) && onInit(true);

    this.modeler = new NavigatedViewer({
      moddleExtensions: {
        ecosTask: ecosTask
      },
      additionalModules: [onlyRenderer]
    });

    if (container) {
      this.container = container;
      this.modeler.attachTo(container);
    }

    await this.setDiagram(diagram, { onMounted });
    this.setEvents({}, modelEvents);

    markedElement && this.setMarkedElement(markedElement);
  };

  get canvas() {
    return this.modeler && this.modeler.get('canvas');
  }

  get viewport() {
    return this.modeler && this.modeler._container.querySelector('.viewport');
  }

  setMarkedElement = element => {
    isFunction(this.canvas.addMarker) && this.canvas.addMarker(element, 'marked-element');

    if (this.modeler && isFunction(this.modeler.get)) {
      const elementToFocus = this.modeler.get('elementRegistry').get(element);

      const canvas = this.modeler.get('canvas');
      const currentViewbox = canvas.viewbox();

      const elementMid = {
        x: elementToFocus.x + elementToFocus.width / 2,
        y: elementToFocus.y + elementToFocus.height / 2
      };

      canvas.viewbox({
        x: elementMid.x - currentViewbox.width / 2,
        y: elementMid.y - currentViewbox.height / 2,
        width: currentViewbox.width,
        height: currentViewbox.height
      });
    }
  };

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
    if (this.container) {
      height = height || this.viewport.getBoundingClientRect().height;
      this.container.style.height = `${height}px`;
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

  renderSheet = props => <Sheet {...props} init={this.init} />;

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
