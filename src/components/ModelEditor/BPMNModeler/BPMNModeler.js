import Modeler from 'bpmn-js/lib/Modeler';
// import from "cmmn-js" because ModelingUtil.getParent from "bpmn-js" package returns null
import { getParent } from 'cmmn-js/lib/features/modeling/util/ModelingUtil';
import { getBusinessObject } from 'cmmn-js/lib/util/ModelUtil';

import BaseModeler from '../BaseModeler';
import additionalModules from './modules';
import './patches';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

export default class BPMNModeler extends BaseModeler {
  initModelerInstance = () => {
    this.modeler = new Modeler({ additionalModules });
  };

  get elementDefinitions() {
    const searchProvider = this.modeler.get('bpmnSearch');
    const root = searchProvider._canvas.getRootElement();

    return getParent(getBusinessObject(root), 'bpmn:Definitions');
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
