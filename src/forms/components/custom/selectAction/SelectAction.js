import React from 'react';

import BaseReactComponent from '../base/BaseReactComponent';
import Dropdown from '../../../../components/common/form/Dropdown';

export default class SelectActionComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'SelectAction',
        key: 'selectAction',
        type: 'selectAction',
        customPredicateJs: null,
        presetFilterPredicatesJs: null,
        hideCreateButton: false,
        hideEditRowButton: false,
        hideDeleteRowButton: false,
        isFullScreenWidthModal: false
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
    return () => <div>Select Action</div>;
    // return Dropdown;
  }

  setReactValue(component, value) {
    console.warn('component, value => ', { component, value });
    this.setReactProps({
      defaultValue: value
    });
  }

  getInitialReactProps() {
    const resolveProps = data => {
      console.warn('getInitialReactProps => ', data);
      return {};
    };

    console.warn('getInitialReactProps => ', this.component);

    // let resolve = createVariants => {
    //   return resolveProps({
    //     ...source,
    //     custom: {
    //       ...source.custom,
    //       createVariants,
    //       record: this.getRecord(),
    //       attribute: this.getAttributeToEdit(),
    //       columns: source.custom.columns.map(item => {
    //         const col = { name: item.name };
    //         if (item.formatter) {
    //           col.formatter = this.evaluate(item.formatter, {}, 'value', true);
    //         }
    //         return col;
    //       })
    //     }
    //   });
    // };

    return resolveProps();
  }

  static getValueDisplayName = (component, value) => {};
}
