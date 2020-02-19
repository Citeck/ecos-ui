import React from 'react';
import get from 'lodash/get';

import BaseReactComponent from '../base/BaseReactComponent';
import Dropdown from '../../../../components/common/form/Dropdown';
import { Types } from './constants';

export default class SelectActionComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'SelectAction',
        placeholder: 'Select action',
        key: 'selectAction',
        type: 'selectAction',
        customPredicateJs: null,
        presetFilterPredicatesJs: null,
        hideCreateButton: false,
        hideEditRowButton: false,
        hideDeleteRowButton: false,
        isFullScreenWidthModal: false,
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
      icon: 'fa fa-th-list',
      group: 'advanced',
      weight: 0,
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

  call = eventName => {
    this.emit(this.interpolate(eventName));
  };

  onSelectItem = item => {
    switch (item.type) {
      case Types.JS.value:
        this.execute(item.formatter);
        break;
      case Types.TRIGGER.value:
        this.call(item.trigger);
        break;
      default:
        console.error('Action type not defined');
    }

    this.setValue(item.name);
  };

  getInitialReactProps() {
    const resolveProps = () => ({
      source: get(this.component, 'source.items', []),
      valueField: 'name',
      titleField: 'name',
      hasEmpty: true,
      placeholder: get(this.component, 'placeholder', ''),
      hideSelected: get(this.component, 'hideSelectedItem', false),
      className: 'formio-select-action__dropdown',
      toggleClassName: 'formio-select-action__dropdown-toggle',
      menuClassName: 'formio-select-action__dropdown-menu',
      controlClassName: 'formio-select-action__dropdown-control',
      onChange: this.onSelectItem
    });

    return resolveProps();
  }
}
