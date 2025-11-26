import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { isExpanded } from 'bpmn-js/lib/util/DiUtil';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';
import React from 'react';

import ecosTask from '../ModelEditor/BPMNModeler/moddle/ecosTask.json';
import { onlyRenderer } from '../ModelEditor/BPMNModeler/modules';
import { ScaleOptions } from '../common/Scaler/util';

import { Sheet } from './Sheet';

import plugins from '@/plugins';

export default class ModelViewer {
  static querySelector = 'ecos-model-container';
  container;
  modeler;
  heatmap;
  #badges;
  #defaultViewBox;

  static getElementName = async (diagram, elementId) => {
    const modeler = new NavigatedViewer({
      moddleExtensions: {
        ecosTask: ecosTask
      },
      additionalModules: [onlyRenderer]
    });

    await modeler.importXML(diagram);
    const element = modeler.get('elementRegistry').get(elementId);

    return get(element, 'businessObject.name') || elementId;
  };

  init = async ({ diagram, container, onInit, onMounted, modelEvents, markedElement, zoom, zoomCenter }) => {
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
    this.setEvents(modelEvents);

    zoom && this.canvas.zoom(zoom, zoomCenter);
    markedElement && this.setMarkedElement(markedElement);

    this.scaleByWidth();
  };

  get canvas() {
    return this.modeler && this.modeler.get('canvas');
  }

  get viewport() {
    return this.modeler && this.modeler._container.querySelector('.viewport');
  }

  setMarkedElement = element => {
    if (this.markedElement) {
      isFunction(this.canvas.removeMarker) && this.canvas.removeMarker(this.markedElement, 'marked-element');
    }
    const elementToFocus = this.modeler.get('elementRegistry').get(element);

    if (!elementToFocus) {
      return;
    }

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

      canvas.zoom(1);
      this.markedElement = element;
    }
  };

  scaleByWidth = () => {
    const canvas = this.modeler.get('canvas');
    const viewboxToScale = canvas.viewbox();

    const width = viewboxToScale.outer.width;
    const innerWidth = viewboxToScale.inner.width;
    canvas.zoom(width / innerWidth);

    const currentViewbox = canvas.viewbox();

    canvas.viewbox({
      ...currentViewbox,
      y: currentViewbox.inner.y
    });
  };

  markElements = markerMap => {
    if (!this.modeler) {
      return;
    }

    if (this.markedElements) {
      Object.entries(this.markedElements).forEach(([element, marker]) => {
        const elementToFocus = this.modeler.get('elementRegistry').get(element);

        if (!elementToFocus) {
          return;
        }

        isFunction(this.canvas.removeMarker) && this.canvas.removeMarker(element, marker);
      });
    }
    this.markedElements = markerMap;
    Object.entries(markerMap).forEach(([element, marker]) => {
      const elementToFocus = this.modeler.get('elementRegistry').get(element);

      if (!elementToFocus) {
        return;
      }

      isFunction(this.canvas.addMarker) && this.canvas.addMarker(element, marker);
    });
  };

  setDiagram = async (diagram, { onMounted }) => {
    let callbackData;
    try {
      if (this.modeler && diagram) {
        const result = await this.modeler.importXML(diagram);
        callbackData = { mounted: !result.error, result };
        this.#defaultViewBox = this.canvas.viewbox();
      } else {
        callbackData = { mounted: false, error: 'No diagram' };
      }
    } catch (error) {
      console.error('Error rendering', error.message);
      callbackData = { mounted: false, error };
    }

    isFunction(onMounted) && onMounted(callbackData);
  };

  setEvents = events => {
    if (events) {
      Object.keys(events).forEach(key => {
        this.modeler.on(key, events[key]);
      });
    }
  };

  setHeight = height => {
    if (this.container) {
      height = height || this.viewport.getBoundingClientRect().height;
      this.container.style.height = `${height}px`;
    }
  };

  setZoom = value => {
    let nv;
    let defaultViewbox;

    switch (value) {
      case ScaleOptions.DEFAULT:
        nv = this.#defaultViewBox.scale;
        defaultViewbox = this.#defaultViewBox;
        break;
      case ScaleOptions.FIT:
        nv = ScaleOptions.FIT;
        break;
      default: {
        let oldScale = this.canvas.viewbox().scale;
        oldScale = isNumber(oldScale) ? oldScale : this.#defaultViewBox.scale;
        const newScale = oldScale + value;
        nv = newScale > ScaleOptions.STEP ? newScale : ScaleOptions.STEP;
      }
    }

    if (defaultViewbox) {
      nv && this.canvas.zoom(nv);
      const resizedViewbox = this.canvas.viewbox();

      const dx = resizedViewbox.x - defaultViewbox.x;
      const dy = resizedViewbox.y - defaultViewbox.y;

      this.canvas.scroll({ dx, dy });
    } else {
      nv && this.canvas.zoom(nv, this.zoomCenter);
    }
    this.redrawHeatmap();
  };

  renderSheet = props => <Sheet {...props} init={this.init} />;

  /**
   * Draw Heatmap
   *
   * @param data {Array}
   * @param hasTooltip {Boolean}
   * @param onChange {Function}
   * @param onMounted {Function}
   * @param formMode {String}
   */
  drawHeatmap = ({ data = [], onChange, onMounted, hasTooltip, formMode }) => {
    const { HeatmapWrapper } = plugins;

    if (HeatmapWrapper) {
      this.heatmap = new HeatmapWrapper({
        instModel: this.modeler,
        data,
        hasTooltip,
        onChange,
        onMounted,
        formMode
      });
    }
  };

  redrawHeatmap = () => {
    if (!this.heatmap) {
      return;
    }
    this.heatmap.repaint();
  };

  drawBadges = ({ data = [], keys = [], withPercentCount = false }) => {
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

        return element && !element.hidden && (isExpanded(element) || is(element, 'bpmn:CallActivity') || is(element, 'bpmn:SubProcess'));
      });

    this.#badges = new Badges();
    this.#badges.create(this.modeler.get('overlays'));

    this.#badges.draw({ data: _data, keys, withPercentCount });
  };

  destroy = () => {
    this.modeler && this.modeler._emit('diagram.destroy');
    this.heatmap && this.heatmap.destroy();
    this.#badges && this.#badges.destroy();
  };
}
