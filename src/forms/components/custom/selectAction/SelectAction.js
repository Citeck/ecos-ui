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
        theme: 'default',
        size: 'normal',
        source: {
          items: []
        }
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

  get items() {
    return get(this, 'component.source.items', []).map(item => ({ ...item, title: this.t(item.name) }));
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
    const theme = get(component, 'theme', 'default');
    const size = get(component, 'size', 'normal');
    const classNames = [
      'formio-select-action__dropdown',
      `formio-select-action__dropdown_theme-${theme}`,
      `formio-select-action__dropdown_size-${size}`
    ];
    const placeholder = this.t(component.placeholder);
    const resolveProps = () => ({
      source: this.items,
      valueField: 'name',
      titleField: 'title',
      hasEmpty: true,
      placeholder,
      className: classNames.join(' '),
      toggleClassName: 'formio-select-action__dropdown-toggle',
      menuClassName: 'formio-select-action__dropdown-menu',
      controlClassName: 'formio-select-action__dropdown-control',
      onChange: this.onSelectItem
    });

    return resolveProps();
  }
}
