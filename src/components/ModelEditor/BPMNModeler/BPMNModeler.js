import Modeler from 'bpmn-js/lib/Modeler';
import { getParent } from 'cmmn-js/lib/features/modeling/util/ModelingUtil';
import { getBusinessObject } from 'cmmn-js/lib/util/ModelUtil';

import BaseModeler from '../BaseModeler';

import ecosTask from './moddle/ecosTask.json';
import customModules from './modules';
import { linting } from './modules/linter';

import { DEFINITON_TYPE } from '@/constants/bpmn';

import './modules/colorContextPadProvider/ColorContextPadProvider';
import './patches/features/modeling/ElementFactory';
import './patches/features/modeling/Modeling';
import './patches/features/modeling/cmd/UpdatePropertiesHandler';
import './patches/features/palette/PaletteProvider';
import './patches/features/popup-menu/ReplaceMenuProvider';
import './patches/features/context-pad/ContextPadProvider';
import './patches/features/keyboard/BpmnKeyboardBindings';
import './patches/features/label-editing/LabelEditingProvider';
import './patches/features/command/CommandStack';
import './patches/features/selection/Selection';

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
