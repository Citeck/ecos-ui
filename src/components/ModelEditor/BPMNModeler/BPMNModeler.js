import Modeler from 'bpmn-js/lib/Modeler';
import { getParent } from 'cmmn-js/lib/features/modeling/util/ModelingUtil';
import { getBusinessObject } from 'cmmn-js/lib/util/ModelUtil';

import BaseModeler from '../BaseModeler';

import ecosTask from './moddle/ecosTask.json';
import customModules from './modules';
import { linting } from './modules/linter';

import { DEFINITON_TYPE } from '@/constants/bpmn';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js-color-picker/colors/color-picker.css';

export default class BPMNModeler extends BaseModeler {
  initModelerInstance = () => {
    this.modeler = new Modeler({
      additionalModules: [customModules],
      moddleExtensions: {
        ecosTask: ecosTask,
      },
      keyboard: { bindTo: document },
      linting,
    });
  };

  get elementDefinitions() {
    const searchProvider = this.modeler.get('bpmnSearch');
    const root = searchProvider._canvas.getRootElement();

    return getParent(getBusinessObject(root), DEFINITON_TYPE);
  }

  saveXML = ({ callback }) => {
    if (!this.modeler) {
      return;
    }

    this.modeler.saveXML({ format: true }).then(callback).catch(callback);
  };

  saveSVG = ({ callback }) => {
    if (!this.modeler) {
      return;
    }

    this.modeler.saveSVG({ format: true }).then(callback).catch(callback);
  };
}
