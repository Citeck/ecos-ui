import BaseReactComponent from '../base/BaseReactComponent';
import MLText from '../../../../components/common/form/Input/MLText';
import { getCurrentLocale } from '../../../../helpers/export/util';
import { checkIsEmptyMlField } from '../../../utils';

export default class MLTextComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'ML Text',
        key: 'mlText',
        type: 'mlText'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'ML Text',
      icon: 'fa fa-language',
      group: 'basic',
      weight: 0,
      schema: MLTextComponent.schema()
    };
  }

  get defaultSchema() {
    return MLTextComponent.schema();
  }

  get emptyValue() {
    return {
      ru: '',
      en: ''
    };
  }

  convertStringValue(value) {
    if (typeof value === 'string') {
      value = {
        [getCurrentLocale()]: value
      };
    }

    return value;
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
    return MLText;
  }

  getInitialValue() {
    return this.convertStringValue(this.dataValue || this.emptyValue);
  }

  handleChange = value => {
    this.setPristine(false);
    this.setValue(value);
  };

  getInitialReactProps() {
    return {
      ...this.htmlAttributes,
      viewOnly: this.viewOnly,
      value: this.getInitialValue(),
      placeholder: this.placeholder,
      onChange: this.handleChange
    };
  }
}
