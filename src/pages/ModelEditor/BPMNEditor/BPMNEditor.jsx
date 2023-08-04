import React, { useEffect, useState } from 'react';
import uuidv4 from 'uuid/v4';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { SourcesId } from '../../../constants';
import { PREFIX_FORM_ELM, SUBPROCESS_TYPE, TYPE_BPMN_PROCESS } from '../../../constants/bpmn';
import BPMNModeler from '../../../components/ModelEditor/BPMNModeler';

import {
  ELEMENT_TYPES_WITH_CUSTOM_FORM_DETERMINER,
  ELEMENT_TYPES_FORM_DETERMINER_BY_DEF_TYPE_MAP,
  ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP,
  BPMN_DELIMITER,
  BPMN_PREFIX_UNDERLINE
} from '../../../constants/bpmn';

import { t } from '../../../helpers/export/util';

import ModelEditor from '../ModelEditor';

class BPMNEditorPage extends ModelEditor {
  static modelType = 'bpmn';

  initModeler = () => {
    this.designer = new BPMNModeler();
  };

  get linter() {
    if (!this.designer) {
      return null;
    }

    return get(this, 'designer.modeler.get', () => null)('linting');
  }

  get formId() {
    return this.formType ? `${SourcesId.FORM}${PREFIX_FORM_ELM}${this.formType}` : null;
  }

  Component = ({ linterResult }) => {
    const [errors, setErrors] = useState(linterResult.errors || 0);
    const [warnings, setWarnings] = useState(linterResult.warnings || 0);
    const [text, setText] = useState(t('bpmn-linter.toggle') || '');

    useEffect(
      () => {
        if (errors !== linterResult.errors) {
          setErrors(linterResult.errors);
        }
      },
      [linterResult.errors]
    );

    useEffect(
      () => {
        if (warnings !== linterResult.warnings) {
          setWarnings(linterResult.warnings);
        }
      },
      [linterResult.warnings]
    );

    useEffect(
      () => {
        let newText = t('bpmn-linter.toggle');

        if (warnings || errors) {
          newText += `\n${t('bpmn-linter.all-errors', { errors, warnings })}`;
        }

        if (text !== newText) {
          setText(newText);
        }
      },
      [warnings, errors]
    );

    return <div>{text}</div>;
  };

  get editorExtraButtons() {
    const extraButtons = super.editorExtraButtons;
    const linter = this.linter;

    if (linter) {
      extraButtons.config.push({
        icon: 'icon-bug',
        action: this.handleToggleLinter,
        id: `bpmn-linter-toggle-${uuidv4()}`,
        trigger: 'hover',
        className: linter.isActive() ? 'ecos-btn_red' : '',
        contentComponent: () => <this.Component linterResult={this.linter.getLintResult()} />
      });
    }

    return extraButtons;
  }

  getFormType(selectedElement) {
    const elementType = this._determineElementType(selectedElement || {});

    return elementType ? `${SourcesId.FORM}${PREFIX_FORM_ELM}${elementType}` : null;
  }

  get formTitle() {
    if (!this.formType || !this.state.selectedElement) {
      return null;
    }

    const selectedElement = this.state.selectedElement;
    const sourceType = selectedElement.$type || selectedElement.type;

    let type = this._determineElementType(selectedElement || {});

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

    const isNonInterrupting =
      get(selectedElement, 'businessObject.cancelActivity') === false || get(selectedElement, 'businessObject.isInterrupting') === false;
    if (isNonInterrupting) {
      title = title + ' (' + t('is_non_interrupting') + ')';
    }

    const isTriggeredByEvent = type === SUBPROCESS_TYPE && get(selectedElement, 'businessObject.triggeredByEvent');
    if (isTriggeredByEvent) {
      title = `Event ${title}`;
    }

    return title;
  }

  _determineElementType(selectedElement) {
    const elementType = selectedElement.$type || selectedElement.type;

    if (ELEMENT_TYPES_WITH_CUSTOM_FORM_DETERMINER.includes(elementType)) {
      const eventDefType = get(selectedElement, 'businessObject.eventDefinitions[0].$type');

      if (!isEmpty(eventDefType) && ELEMENT_TYPES_FORM_DETERMINER_BY_DEF_TYPE_MAP.has(eventDefType)) {
        return ELEMENT_TYPES_FORM_DETERMINER_BY_DEF_TYPE_MAP.get(eventDefType);
      }

      const ecosTaskType = get(selectedElement, 'businessObject.taskType');

      if (!isEmpty(ecosTaskType) && ELEMENT_TYPES_FORM_DETERMINER_BY_ECOS_TASK_TYPE_MAP.has(ecosTaskType)) {
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

  handleToggleLinter = event => {
    const linter = this.linter;

    event.persist();

    if (linter) {
      linter.toggle.call(linter, !linter.isActive());

      event.currentTarget.classList.toggle('ecos-btn_red');
      linter._eventBus.fire('linting.completed');
    }
  };
}

export default BPMNEditorPage;
