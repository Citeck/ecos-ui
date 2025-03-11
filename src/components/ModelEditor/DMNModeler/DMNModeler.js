import { getDi } from 'bpmn-js/lib/util/ModelUtil';
import { CamundaPlatformModeler as Modeler } from 'camunda-dmn-js';
import NavigatedViewer from 'dmn-js-drd/lib/NavigatedViewer';
import { getBusinessObject } from 'dmn-js-shared/lib/util/ModelUtil';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import BaseModeler from '../BaseModeler';

import { LABEL_POSTFIX, PLANE_POSTFIX } from '@/constants/cmmn';

import './patches/features/modeling/cmd/UpdatePropertiesHandler';
import './patches/features/modeling/Modeling';
import './patches/Viewer';

export default class DMNModeler extends BaseModeler {
  __saveSvgFunc;

  initModelerInstance = () => {
    this.modeler = new Modeler({
      additionalModules: [],
    });
  };

  get elementDefinitions() {
    const activeViewer = this.modeler.getActiveViewer();
    if (activeViewer && isFunction(activeViewer.get)) {
      const canvas = activeViewer.get('canvas');
      if (canvas) {
        const root = canvas.getRootElement();
        return getBusinessObject(root);
      }
    }

    return null;
  }

  get viewType() {
    if (this.modeler) {
      const activeView = this.modeler.getActiveView();
      return activeView.type;
    }

    return null;
  }

  getEventBus() {
    const activeViewer = this.modeler.getActiveViewer();
    if (!activeViewer) {
      return;
    }

    return activeViewer.get('eventBus');
  }

  initZoomScroll = () => {
    const activeViewer = this.modeler.getActiveViewer();
    if (activeViewer && isFunction(activeViewer.get)) {
      this.zoomScroll = activeViewer.get('zoomScroll');
    }
  };

  zoomIn = () => {
    this.initZoomScroll();
    this.zoomScroll.stepZoom(1);
  };

  zoomOut = () => {
    this.initZoomScroll();
    this.zoomScroll.stepZoom(-1);
  };

  zoomReset = () => {
    this.initZoomScroll();
    this.zoomScroll.reset();
  };

  saveSVG = ({ callback }) => {
    const activeViewer = this.modeler.getActiveViewer();

    if (!activeViewer) {
      return;
    }

    if (!this.__saveSvgFunc) {
      return;
    }

    this.__saveSvgFunc()
      .then(callback)
      .catch((error) => callback({ error, svg: null }));
  };

  setDrdViewerEvents = (event) => {
    const activeViewer = event.viewer;
    if (!activeViewer) {
      return;
    }

    const events = this.defaultEvents;
    const extraEvents = this.defaultExtraEvents;

    if (events && events.onSelectElement) {
      this.events.onSelectElement = (e) => {
        if (get(e, 'newSelection.length', 0) < 2) {
          events.onSelectElement(get(e, 'newSelection[0]'));
        }
      };
      activeViewer.on('selection.changed', this.events.onSelectElement);
    }

    if (events && events.onChangeElement) {
      this.events.onChangeElement = (e) => events.onChangeElement(get(e, 'element'));
      activeViewer.on('element.changed', this.events.onChangeElement);
    }

    if (events && events.onClickElement) {
      this.events.onClickElement = (e) => events.onClickElement(get(e, 'element'));
      activeViewer.on('element.click', this.events.onClickElement);
    }

    if (events && events.onChangeElementLabel) {
      this.events.onChangeElementLabel = (e) => events.onChangeElementLabel(get(e, 'target.innerText'));
      activeViewer._container.addEventListener('keyup', this.events.onChangeElementLabel);
    }

    if (extraEvents) {
      Object.keys(extraEvents).forEach((key) => {
        activeViewer.on(key, extraEvents[key]);
        this.modeler.on(key, extraEvents[key]);
      });
    }

    activeViewer.on('element.changed', (e) => {
      if (Object.getPrototypeOf(activeViewer) instanceof NavigatedViewer) {
        const canvas = activeViewer.get('canvas');
        const activeLayer = canvas.getActiveLayer();

        const canvasSvg = canvas._svg.cloneNode(true);
        const layer = activeLayer.cloneNode(true);
        const bbox = cloneDeep(activeLayer.getBBox());

        this.__saveSvgFunc = activeViewer.saveSVG.bind(this, canvasSvg, layer, bbox);
      }
    });
  };

  setEvents = (events, extraEvents) => {
    // unsubscribe for added events in this.destroy below
    this.defaultEvents = events;
    this.defaultExtraEvents = extraEvents;

    this.modeler.on('viewer.created', this.setDrdViewerEvents);
  };

  updateProps = (element, properties, withClear) => {
    const { id, ...data } = properties;

    const activeViewer = this.modeler.getActiveViewer();

    if (!activeViewer) {
      return;
    }

    const modeling = activeViewer.get('modeling');
    const di = getDi(element) || getDi(element.businessObject);

    if (!isEmpty(id) && !id.endsWith(LABEL_POSTFIX) && !id.endsWith(PLANE_POSTFIX) && di) {
      if (!this.idAssigned(id, element.businessObject)) {
        data.id = id;
      }
    }

    if (data) {
      if (!element.businessObject) {
        element.businessObject = element.businessObject || element;
      }
      isFunction(modeling.updateProperties) && element.businessObject && modeling.updateProperties(element, data, withClear);
    }
  };

  destroy = () => {
    this.modeler && this.modeler.off('viewer.created', this.setDrdViewerEvents);
  };
}
