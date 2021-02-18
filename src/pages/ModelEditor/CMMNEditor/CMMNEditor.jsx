import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

import CMMNModeler from '../../../components/ModelEditor/CMMNModeler';
import { getEcosType } from '../../../components/ModelEditor/CMMNModeler/utils';
import {
  TYPE_DI_DIAGRAM,
  TYPE_DI_EDGE,
  TYPE_ENTRY_CRITERION,
  TYPE_EXIT_CRITERION,
  TYPE_IF_PART,
  TYPE_LABEL,
  TYPE_PLAN_ITEM,
  PREFIX_FORM_ELM
} from '../../../constants/cmmn';

import ModelEditor from '../ModelEditor';
import { SourcesId } from '../../../constants';

class CMMNEditorPage extends ModelEditor {
  static modelType = 'cmmn';

  initModeler = () => {
    this.designer = new CMMNModeler();
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

  get formId() {
    return this.formType ? `${SourcesId.EFORM}${PREFIX_FORM_ELM}${this.formType}` : null;
  }

  _getBusinessObjectByDiagramElement(element) {
    if (!element) {
      return element;
    }
    if (element.type === TYPE_DI_DIAGRAM) {
      element = this.designer.elementDefinitions;
    } else if (element.type === TYPE_ENTRY_CRITERION || element.type === TYPE_EXIT_CRITERION) {
      let sentry = element.businessObject.sentryRef;
      if (!sentry.ifPart) {
        const ifPart = this.designer.getCmmnFactory().create(TYPE_IF_PART);
        ifPart.$parent = sentry;
        sentry.ifPart = ifPart;
      }
      element = sentry.ifPart;
    } else if (element.type === TYPE_DI_EDGE || element.type === TYPE_LABEL) {
      element = element.businessObject.cmmnElementRef;
    } else if (element.type === TYPE_PLAN_ITEM) {
      element = element.businessObject.definitionRef;
    }

    return element;
  }
}

export default CMMNEditorPage;
