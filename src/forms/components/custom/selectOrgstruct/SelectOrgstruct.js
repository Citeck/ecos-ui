import React from 'react';
import ReactDOM from 'react-dom';
import BaseComponent from '../base/BaseComponent';
import SelectOrgstruct from '../../../../components/common/form/SelectOrgstruct';
import isEqual from 'lodash/isEqual';

export default class SelectOrgstructComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'SelectOrgstruct',
        key: 'selectOrgstruct',
        type: 'selectOrgstruct'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Select Orgstruct',
      icon: 'fa fa-th-list',
      group: 'advanced',
      weight: 0,
      schema: SelectOrgstructComponent.schema()
    };
  }

  get defaultSchema() {
    return SelectOrgstructComponent.schema();
  }

  build() {
    this.restoreValue();

    this.createElement();

    const labelAtTheBottom = this.component.labelPosition === 'bottom';
    if (!labelAtTheBottom) {
      this.createLabel(this.element);
    }

    this.reactContainer = this.ce('div');
    this.element.appendChild(this.reactContainer);

    if (this.shouldDisable) {
      this.disabled = true;
    }

    this.errorContainer = this.element;
    this.createErrorElement();

    this.renderReactComponent();

    // this.setInputStyles(this.inputsContainer);

    if (labelAtTheBottom) {
      this.createLabel(this.element);
    }

    this.createDescription(this.element);

    // this.attachLogic();
  }

  renderReactComponent(config = {}) {
    let self = this;
    let component = this.component;

    const onChange = this.onValueChange.bind(this);

    let renderControl = function() {
      ReactDOM.render(
        <SelectOrgstruct
          defaultValue={self.dataValue}
          isCompact={component.isCompact}
          multiple={component.multiple}
          placeholder={component.placeholder}
          disabled={component.disabled}
          onChange={onChange}
          onError={err => {
            // this.setCustomValidity(err, false);
          }}
        />,
        self.reactContainer
      );
    };

    renderControl();
  }

  refreshDOM() {
    if (this.reactContainer) {
      this.renderReactComponent();
    }
  }

  onValueChange(value) {
    this.dataValue = value;
    this.triggerChange();
    this.refreshDOM();
  }

  get emptyValue() {
    return this.component.multiple ? [] : null;
  }

  getValue() {
    return this.dataValue;
  }

  setValue(value) {
    if (isEqual(value, this.dataValue)) {
      return null;
    }

    if (this.reactContainer && value !== this.dataValue) {
      ReactDOM.unmountComponentAtNode(this.reactContainer);
    }

    this.dataValue = value || this.component.defaultValue || this.emptyValue;
    this.refreshDOM();
  }
}
