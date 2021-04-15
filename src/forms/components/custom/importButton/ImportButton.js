import BaseReactComponent from '../base/BaseReactComponent';
import { Btn } from '../../../../components/common/btns';

export default class ImportButtonComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'Import Button',
        key: 'importButton',
        type: 'importButton',
        defaultValue: {}
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Import Button',
      icon: 'fa fa-upload',
      group: 'advanced',
      weight: 0,
      schema: ImportButtonComponent.schema()
    };
  }

  get defaultSchema() {
    return ImportButtonComponent.schema();
  }

  getComponentToRender() {
    return Btn;
  }

  getInitialReactProps() {
    return {
      onClick: this.handleClick
    };
  }

  setReactValue(component, value) {
    this.setReactProps({ value });
  }

  handleClick = () => {
    console.warn('click');
  };
}
