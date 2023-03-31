import { CamundaPlatformModeler as Modeler } from 'camunda-dmn-js';
import { getBusinessObject } from 'dmn-js-shared/lib/util/ModelUtil';
import 'camunda-dmn-js/dist/assets/camunda-platform-modeler.css';
import { getDi } from 'bpmn-js/lib/util/ModelUtil';
import isFunction from 'lodash/isFunction';
import get from 'lodash/get';
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';

import { DI_POSTFIX, LABEL_POSTFIX, PLANE_POSTFIX } from '../../../constants/cmmn';
import BaseModeler from '../BaseModeler';
export default class DMNModeler extends BaseModeler {
  initModelerInstance = () => {
    this.modeler = new Modeler({
      additionalModules: []
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

    activeViewer
      .saveSVG({ format: true })
      .then(callback)
      .catch(callback);
  };

  setDrdViewerEvents = event => {
    const activeViewer = event.viewer;
    if (!activeViewer) {
      return;
    }

    const events = this.defaultEvents;
    const extraEvents = this.extraEvents;

    if (events && events.onSelectElement) {
      this.events.onSelectElement = e => {
        if (get(e, 'newSelection.length', 0) < 2) {
          events.onSelectElement(get(e, 'newSelection[0]'));
        }
      };
      activeViewer.on('selection.changed', this.events.onSelectElement);
    }

    if (events && events.onChangeElement) {
      this.events.onChangeElement = e => events.onChangeElement(get(e, 'element'));
      activeViewer.on('element.changed', this.events.onChangeElement);
    }

    if (events && events.onClickElement) {
      this.events.onClickElement = e => events.onClickElement(get(e, 'element'));
      activeViewer.on('element.click', this.events.onClickElement);
    }

    if (events && events.onChangeElementLabel) {
      this.events.onChangeElementLabel = e => events.onChangeElementLabel(get(e, 'target.innerText'));
      activeViewer._container.addEventListener('keyup', this.events.onChangeElementLabel);
    }

    if (extraEvents) {
      Object.keys(extraEvents).forEach(key => {
        activeViewer.on(key, extraEvents[key]);
      });
    }
  };

  setEvents = (events, extraEvents) => {
    // unsubscribe for added events in this.destroy below
    this.defaultEvents = events;
    this.defaultExtraEvents = extraEvents;

    this.modeler.on('viewer.created', this.setDrdViewerEvents);
  };

  updateProps = (element, properties) => {
    const { name, id, ...data } = properties;
    const activeViewer = this.modeler.getActiveViewer();

    if (!activeViewer) {
      return;
    }

    const modeling = activeViewer.get('modeling');
    const di = getDi(element);

    if (!isNil(name) && di) {
      const labelEditingProvider = activeViewer.get('labelEditingProvider');

      isFunction(labelEditingProvider.update) && labelEditingProvider.update(element, name, name, element);
    }

    if (!isEmpty(id) && !id.endsWith(LABEL_POSTFIX) && !id.endsWith(PLANE_POSTFIX) && di) {
      if (!this.idAssigned(id, element.businessObject)) {
        data.id = id;
        isFunction(modeling.updateModdleProperties) && modeling.updateModdleProperties(element, di, { id: id + DI_POSTFIX });
      }
    }

    if (data) {
      isFunction(modeling.updateProperties) && element.businessObject && modeling.updateProperties(element, data);
    }
  };

  destroy = () => {
    this.modeler.off('viewer.created', this.setDrdViewerEvents);
  };
}
