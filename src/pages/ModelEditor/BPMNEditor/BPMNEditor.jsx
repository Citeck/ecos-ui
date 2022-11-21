import { SourcesId } from '../../../constants';
import { PREFIX_FORM_ELM, TYPE_BPMN_PROCESS } from '../../../constants/bpmn';
import BPMNModeler from '../../../components/ModelEditor/BPMNModeler';

import {
  ELEMENT_TYPES_WITH_CUSTOM_FORM_DETERMINER,
  ELEMENT_TYPES_FORM_DETERMINER_BY_DEF_TYPE_MAP,
  ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP,
  BPMN_DELIMITER,
  BPMN_PREFIX_UNDERLINE
} from '../../../constants/bpmn';

import { t } from '../../../helpers/export/util';
import _ from 'lodash';
import get from 'lodash/get';

import ModelEditor from '../ModelEditor';

class BPMNEditorPage extends ModelEditor {
  static modelType = 'bpmn';

  initModeler = () => {
    this.designer = new BPMNModeler();
  };

  get formId() {
    return this.formType ? `${SourcesId.FORM}${PREFIX_FORM_ELM}${this.formType}` : null;
  }

  getFormType(selectedElement) {
    const elementType = this._determineElementType(selectedElement);

    //TODO: remove
    console.log('Second Type: ' + elementType);

    return elementType ? `${SourcesId.FORM}${PREFIX_FORM_ELM}${elementType}` : null;
  }

  get formTitle() {
    if (!this.formType || !this.state.selectedElement) {
      return null;
    }
    const selectedElement = this.state.selectedElement;

    const sourceType = selectedElement.$type || selectedElement.type;
    let type = this._determineElementType(selectedElement);

    if (sourceType !== type) {
      const sourceTypeValue = sourceType.split(BPMN_DELIMITER).pop();
      const typeValue = type.split(BPMN_DELIMITER).pop();

      type = BPMN_PREFIX_UNDERLINE + sourceTypeValue + '_' + typeValue;
    }

    var translationKey = (type || '').replace(BPMN_DELIMITER, '_');
    if (!translationKey.startsWith(BPMN_PREFIX_UNDERLINE)) {
      translationKey = BPMN_PREFIX_UNDERLINE + translationKey;
    }

    let title = t(translationKey);
    if (title === translationKey) {
      title = translationKey.split('_').pop();
    }

    const isNonInterrupting = get(selectedElement, 'businessObject.cancelActivity') === false;
    if (isNonInterrupting) {
      title = title + ' (' + t('is_non_interrupting') + ')';
    }

    return title;
  }

  _determineElementType(selectedElement) {
    const elementType = selectedElement.$type || selectedElement.type;

    //TODO: remove
    console.log(selectedElement);
    console.log('First Type: ' + elementType);

    if (ELEMENT_TYPES_WITH_CUSTOM_FORM_DETERMINER.includes(elementType)) {
      let eventDefType = get(selectedElement, 'businessObject.eventDefinitions[0].$type');
      if (!_.isEmpty(eventDefType) && ELEMENT_TYPES_FORM_DETERMINER_BY_DEF_TYPE_MAP.has(eventDefType)) {
        return ELEMENT_TYPES_FORM_DETERMINER_BY_DEF_TYPE_MAP.get(eventDefType);
      }

      let ecosTaskType = get(selectedElement, 'businessObject.taskType');
      if (!_.isEmpty(ecosTaskType) && ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP.has(ecosTaskType)) {
        return ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP.get(ecosTaskType);
      }
    }

    return elementType;
  }

  _getBusinessObjectByDiagramElement(element) {
    if (element && element.type === TYPE_BPMN_PROCESS) {
      return this.designer.elementDefinitions;
    }

    return element;
  }
}

export default BPMNEditorPage;
