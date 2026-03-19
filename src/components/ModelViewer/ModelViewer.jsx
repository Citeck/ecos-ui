import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';
import React from 'react';

import ecosTask from '../ModelEditor/BPMNModeler/moddle/ecosTask.json';
import { onlyRenderer } from '../ModelEditor/BPMNModeler/modules';
import { withoutCanvasScroll } from './BPMNViewer/modules';
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
      additionalModules: [onlyRenderer, withoutCanvasScroll]
    });

    await modeler.importXML(diagram);
    const element = modeler.get('elementRegistry').get(elementId);

    return get(element, 'businessObject.name') || elementId;
  };

  init = async ({ diagram, container, onInit, onMounted, modelEvents, markedElement, zoom, zoomCenter }) => {
    isFunction(onInit) && onInit(true);

    if (this.modeler) {
      this.destroy();
    }

    this.modeler = new NavigatedViewer({
      moddleExtensions: {
        ecosTask: ecosTask
      },
      additionalModules: [onlyRenderer, withoutCanvasScroll]
    });

    if (container) {
      this.container = container;
      this.modeler.attachTo(container);
    }

    await this.setDiagram(diagram, { onMounted });
    this.setEvents(modelEvents);

    if (zoom && this.canvas.viewbox().inner.width > 0) {
      this.canvas.zoom(zoom, zoomCenter);
    }
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

    if (!innerWidth) {
      return;
    }

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

    // Collect IDs of activities that have their own stats from the API
    const dataIds = new Set(data && data.map(item => item.id));

    // Find the collapsed SubProcess on the current root layer for a nested element.
    // Planes (e.g. SubProcess_X_plane) are root elements without a parent,
    // so we map plane ID → collapsed SubProcess ID by stripping the _plane suffix.
    const findCollapsedAncestor = el => {
      const parent = el.parent;

      if (!parent) {
        return null;
      }

      const collapsedId = parent.id.replace(/_plane$/, '');

      if (collapsedId !== parent.id) {
        // Parent is a _plane element — find the corresponding collapsed SubProcess
        const collapsed = elementRegistry.get(collapsedId);

        if (collapsed) {
          const collapsedParent = get(collapsed, 'parent') || {};

          if (collapsedParent.layer === root.layer) {
            return collapsed;
          }

          // The collapsed SubProcess is itself nested — recurse up
          return findCollapsedAncestor(collapsed);
        }
      }

      return null;
    };

    // Aggregate nested element stats onto their closest visible ancestor (collapsed SubProcess)
    const aggregated = {};

    data &&
      data.forEach(item => {
        const element = elementRegistry.get(item.id);

        if (!element) {
          return;
        }

        const parent = get(element, 'parent') || {};

        if (!parent.layer || parent.layer === root.layer) {
          // Element is on the current root layer — keep as-is
          if (!element.hidden) {
            aggregated[item.id] = aggregated[item.id] || { ...item, instances: 0, incidents: 0 };
            aggregated[item.id].instances += item.instances || 0;
            aggregated[item.id].incidents += item.incidents || 0;
          }
          return;
        }

        // Element is nested — find closest collapsed SubProcess ancestor on the current root layer
        const collapsed = findCollapsedAncestor(element);

        if (!collapsed || collapsed.hidden) {
          return;
        }

        const targetId = collapsed.id;

        // Only aggregate if the SubProcess doesn't already have its own stats from the API
        // (to avoid double-counting when API returns both SubProcess and its children)
        if (dataIds.has(targetId)) {
          return;
        }

        aggregated[targetId] = aggregated[targetId] || { ...item, id: targetId, instances: 0, incidents: 0 };
        aggregated[targetId].instances += item.instances || 0;
        aggregated[targetId].incidents += item.incidents || 0;
      });

    const _data = Object.values(aggregated).map(item => ({
      ...item,
      incidents: item.incidents || undefined
    }));

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
