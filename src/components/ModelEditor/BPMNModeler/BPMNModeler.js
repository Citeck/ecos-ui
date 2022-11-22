import Modeler from 'bpmn-js/lib/Modeler';
// import from "cmmn-js" because ModelingUtil.getParent from "bpmn-js" package returns null
import { getParent } from 'cmmn-js/lib/features/modeling/util/ModelingUtil';
import { getBusinessObject } from 'cmmn-js/lib/util/ModelUtil';

import BaseModeler from '../BaseModeler';
import customModules from './modules';
import NativeCopyModule from './modules/NativeCopyModule';
import './patches';

import ecosTask from './moddle/ecosTask.json';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

export default class BPMNModeler extends BaseModeler {
  initModelerInstance = () => {
    this.modeler = new Modeler({
      additionalModules: [customModules, NativeCopyModule],
      moddleExtensions: {
        ecosTask: ecosTask
      },
      keyboard: { bindTo: document }
    });
  };

  get elementDefinitions() {
    const searchProvider = this.modeler.get('bpmnSearch');
    const root = searchProvider._canvas.getRootElement();

    return getParent(getBusinessObject(root), 'bpmn:Definitions');
  }

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
