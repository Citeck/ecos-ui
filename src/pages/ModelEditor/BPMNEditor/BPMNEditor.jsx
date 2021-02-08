import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { SourcesId } from '../../../constants';
import { PREFIX_FORM_ELM } from '../../../constants/bpmn';
import BPMNModeler from '../../../components/BPMNModeler';

import ModelEditor from '../ModelEditor';

class BPMNEditorPage extends ModelEditor {
  static modelType = 'bpmn';

  initModeler = () => {
    this.designer = new BPMNModeler();
  };

  get formId() {
    return this.formType ? `${SourcesId.EFORM}${PREFIX_FORM_ELM}${this.formType}` : null;
  }

  get formTitle() {
    if (!this.formType || !this.state.selectedElement) {
      return null;
    }

    const element = getBusinessObject(this.state.selectedElement);

    return element.$type;
  }
}

export default BPMNEditorPage;
