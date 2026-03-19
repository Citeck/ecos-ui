import ColorPickerComponent from '../../../../components/common/form/ColorPicker';
import BaseReactComponent from '../base/BaseReactComponent';

export default class ColorPickerFormComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'Color Picker',
        key: 'colorPicker',
        type: 'colorPicker',
        input: true,
        defaultValue: ''
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Color Picker',
      icon: 'fa fa-eyedropper',
      group: 'advanced',
      weight: 10,
      schema: ColorPickerFormComponent.schema()
    };
  }

  get defaultSchema() {
    return ColorPickerFormComponent.schema();
  }

  getComponentToRender() {
    return ColorPickerComponent;
  }

  getInitialReactProps() {
    return {
      value: this.dataValue || '',
      onChange: this.onReactValueChanged,
      disabled: this.disabled
    };
  }

  setReactValue(component, value) {
    this.setReactProps({ value });
  }
}
