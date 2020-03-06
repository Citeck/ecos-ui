import get from 'lodash/get';
import BaseReactComponent from '../base/BaseReactComponent';
import Dropdown from '../../../../components/common/form/Dropdown';
import { Types } from './constants';

export default class SelectActionComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'Select Action',
        placeholder: 'Select action',
        key: 'selectAction',
        type: 'selectAction',
        source: {
          items: []
        },
        showValidations: false
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Select Action',
      icon: 'fa fa-chevron-circle-down',
      group: 'basic',
      weight: 120,
      schema: SelectActionComponent.schema()
    };
  }

  get defaultSchema() {
    return SelectActionComponent.schema();
  }

  getComponentToRender() {
    return Dropdown;
  }

  setReactValue(component, value) {
    this.setReactProps({
      value
    });
  }

  execute = js => {
    this.evaluate(js, {}, 'value', true);
  };

  triggerEvent = eventName => {
    this.emit(this.interpolate(eventName));
  };

  onSelectItem = item => {
    switch (item.type) {
      case Types.JS.value:
        this.execute(item.code);
        break;
      case Types.TRIGGER.value:
        this.triggerEvent(item.eventName);
        break;
      default:
        console.error('Action type is not defined');
    }
  };

  getInitialReactProps() {
    const component = this.component;
    const resolveProps = () => ({
      source: get(component, 'source.items', []),
      valueField: 'name',
      titleField: 'name',
      hasEmpty: true,
      placeholder: component.placeholder,
      className: 'formio-select-action__dropdown',
      toggleClassName: 'formio-select-action__dropdown-toggle',
      menuClassName: 'formio-select-action__dropdown-menu',
      controlClassName: 'formio-select-action__dropdown-control',
      onChange: this.onSelectItem
    });

    return resolveProps();
  }
}
