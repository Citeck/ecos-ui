import BaseReactComponent from '../base/BaseReactComponent';
import MLInput from '../../../../components/common/form/Input/MLInput';

export default class MLInputComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'Multilang Input',
        key: 'multiLangInput',
        type: 'multiLangInput'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Multilang Input',
      icon: 'fa fa-language',
      group: 'basic',
      weight: 0,
      schema: MLInputComponent.schema()
    };
  }

  get defaultSchema() {
    return MLInputComponent.schema();
  }

  get emptyValue() {
    return {
      ru: '',
      en: ''
    };
  }

  setReactValue(component, value) {
    this.setReactProps({ value });
  }

  getComponentToRender() {
    return MLInput;
  }

  getInitialReactProps() {
    return {
      value: this.dataValue || {},
      onChange: value => {
        this.setValue(value, {});
        // this.onReactValueChanged(value, { skipReactWrapperUpdating: false });
      }
    };
  }
}
