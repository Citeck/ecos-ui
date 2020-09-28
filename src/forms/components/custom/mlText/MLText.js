import BaseReactComponent from '../base/BaseReactComponent';
import MLText from '../../../../components/common/form/Input/MLText';

export default class MLTextComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'ML Text',
        key: 'mlText',
        type: 'mlText',
        defaultValue: {}
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

  setReactValue(component, value) {
    this.setReactProps({ value });
  }

  getComponentToRender() {
    return MLText;
  }

  getInitialReactProps() {
    return {
      value: this.dataValue || this.emptyValue,
      onChange: value => {
        this.setPristine(false);
        this.setValue(value);
      }
    };
  }
}
