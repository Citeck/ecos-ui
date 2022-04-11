import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { SourcesId } from '../../../constants';
import { PREFIX_FORM_ELM, TYPE_BPMN_PROCESS } from '../../../constants/bpmn';
import BPMNModeler from '../../../components/ModelEditor/BPMNModeler';

import ModelEditor from '../ModelEditor';

class BPMNEditorPage extends ModelEditor {
  static modelType = 'bpmn';

  initModeler = () => {
    this.designer = new BPMNModeler();
  };

  get formId() {
    return this.formType ? `${SourcesId.FORM}${PREFIX_FORM_ELM}${this.formType}` : null;
  }

  get formTitle() {
    if (!this.formType || !this.state.selectedElement) {
      return null;
    }

    const element = getBusinessObject(this.state.selectedElement);

    return element.$type;
  }

  _getBusinessObjectByDiagramElement(element) {
    if (element && element.type === TYPE_BPMN_PROCESS) {
      return this.designer.elementDefinitions;
    }

    return element;
  }
}

export default BPMNEditorPage;
