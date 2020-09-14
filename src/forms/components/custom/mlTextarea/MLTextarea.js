import BaseReactComponent from '../base/BaseReactComponent';
import MLTextarea from '../../../../components/common/form/Textarea/MLTextarea';

export default class MLTextareaComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'ML Textarea',
        key: 'mlTextarea',
        type: 'mlTextarea',
        defaultValue: {}
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

  setReactValue(component, value) {
    this.setReactProps({ value });
  }

  getComponentToRender() {
    return MLTextarea;
  }

  getInitialReactProps() {
    return {
      value: this.dataValue || this.emptyValue,
      lang: this.component.lang,
      onChange: value => {
        this.setPristine(false);
        this.setValue(value);
      }
    };
  }
}
