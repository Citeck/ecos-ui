import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

import CMMNDesigner from '../../../components/CMMNDesigner';
import { getEcosType } from '../../../components/CMMNDesigner/utils';

import ModelEditor from '../ModelEditor';

class CMMNEditorPage extends ModelEditor {
  static modelType = 'cmmn';

  initModeler = () => {
    this.designer = new CMMNDesigner();
  };

  get formType() {
    const { selectedElement } = this.state;

    if (selectedElement) {
      const type = getEcosType(selectedElement) || selectedElement.$type || selectedElement.type;
      if (!type) {
        console.error('Type is not found for element', selectedElement);
      } else {
        return type;
      }
    }

    return undefined;
  }

  get formTitle() {
    return this.formType ? ModelUtil.getName(this.state.selectedElement) : null;
  }
}

export default CMMNEditorPage;
