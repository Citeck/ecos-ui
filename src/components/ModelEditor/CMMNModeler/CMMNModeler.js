import Modeler from 'cmmn-js/lib/Modeler';
import { getParent } from 'cmmn-js/lib/features/modeling/util/ModelingUtil';
import { getBusinessObject } from 'cmmn-js/lib/util/ModelUtil';

import BaseModeler from '../BaseModeler';
import additionalModules from './modules';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn.css';

export default class CMMNModeler extends BaseModeler {
  initModelerInstance = () => {
    this.modeler = new Modeler({ additionalModules });
  };

  get elementDefinitions() {
    const searchProvider = this.modeler.get('cmmnSearch');
    const root = searchProvider._canvas.getRootElement();

    return getParent(getBusinessObject(root), 'cmmn:Definitions');
  }

  getCmmnFactory() {
    return this.modeler.get('cmmnFactory');
  }
}
