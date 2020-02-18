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
    return Dropdown;
  }

  getInitialReactProps() {}

  static getValueDisplayName = (component, value) => {};
}
