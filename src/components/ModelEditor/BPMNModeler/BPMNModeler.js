import Modeler from 'bpmn-js/lib/Modeler';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import BaseModeler from '../BaseModeler';
import additionalModules from './modules';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

/**
 * Expansion for Modeler
 * @class
 *
 * @param {Modeler} viewer - shows whose container is. You can set using setCustomContainer
 * @param {Object} events - custom events for objects of model
 * Available events: onSelectElement, onChangeElement, onClickElement
 * @param {Boolean} isCustomContainer - shows whose container is. You can set using setCustomContainer
 */
export default class BPMNModeler extends BaseModeler {
  initModelerInstance = () => {
    this.modeler = new Modeler({ additionalModules });
  };

  get elementDefinitions() {
    const searchProvider = this.modeler.get('bpmnSearch');
    const root = searchProvider._canvas.getRootElement();

    return getBusinessObject(root).$parent || null;
  }

  setDiagram = diagram => {
    if (!this.modeler || !diagram) {
      console.warn('No diagram');
      return;
    }

    this.modeler
      .importXML(diagram)
      .then(() => {
        this._isDiagramMounted = true;
      })
      .catch(error => {
        console.error('Error rendering', error);
      });
  };

  saveXML = ({ callback }) => {
    if (!this.modeler) {
      return;
    }

    this.modeler
      .saveXML({ format: true })
      .then(callback)
      .catch(callback);
  };

  saveSVG = ({ callback }) => {
    if (!this.modeler) {
      return;
    }

    this.modeler
      .saveSVG({ format: true })
      .then(callback)
      .catch(callback);
  };
}
