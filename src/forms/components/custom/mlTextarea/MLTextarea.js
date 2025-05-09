import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import MLTextarea from '../../../../components/common/form/Textarea/MLTextarea';
import { getCurrentLocale } from '../../../../helpers/export/util';
import { checkIsEmptyMlField } from '../../../utils';
import BaseReactComponent from '../base/BaseReactComponent';

export default class MLTextareaComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'ML Textarea',
        key: 'mlTextarea',
        type: 'mlTextarea'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'ML Textarea',
      icon: 'fa fa-language',
      group: 'basic',
      weight: 45,
      schema: MLTextareaComponent.schema()
    };
  }

  get defaultSchema() {
    return MLTextareaComponent.schema();
  }

  get emptyValue() {
    return {
      ru: '',
      en: ''
    };
  }

  getValue() {
    const dataValue = super.getValue();
    const value = this.convertStringValue(dataValue);

    if (checkIsEmptyMlField(value)) {
      return this.component.defaultValue;
    }

    return this.convertStringValue(dataValue);
  }

  setReactValue(component, value) {
    this.setReactProps({ value: this.convertStringValue(value) });
  }

  getComponentToRender() {
    return MLTextarea;
  }

  getInitialValue() {
    return this.convertStringValue(this.dataValue || this.emptyValue);
  }

  convertStringValue(value) {
    if (typeof value === 'string') {
      value = {
        [getCurrentLocale()]: value
      };
    }

    return value;
  }

  handleChange = value => {
    this.setPristine(false);
    this.valueChangedByUser = true;
    this.setValue(isEmpty(value) ? this.emptyValue : value);
  };

  getInitialReactProps() {
    return {
      ...this.htmlAttributes,
      editor: !!this.component.editor,
      editorLang: this.component.as,
      viewOnly: this.viewOnly,
      value: this.getInitialValue(),
      required: get(this.schema, 'validate.required', false),
      placeholder: this.placeholder,
      onChange: this.handleChange
    };
  }
}
