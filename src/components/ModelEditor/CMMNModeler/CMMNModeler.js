import Modeler from 'cmmn-js/lib/Modeler';
import ModelUtil from 'cmmn-js/lib/util/ModelUtil';
import ModelingUtil from 'cmmn-js/lib/features/modeling/util/ModelingUtil';

import BaseModeler from '../BaseModeler';
import additionalModules from './modules';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-codes.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-embedded.css';

export default class CMMNModeler extends BaseModeler {
  initModelerInstance = () => {
    this.modeler = new Modeler({ additionalModules });
  };

  get elementDefinitions() {
    const searchProvider = this.modeler.get('cmmnSearch');
    const root = searchProvider._canvas.getRootElement();

    return ModelingUtil.getParent(ModelUtil.getBusinessObject(root), 'cmmn:Definitions');
  }

  getCmmnFactory() {
    return this.modeler.get('cmmnFactory');
  }
}
