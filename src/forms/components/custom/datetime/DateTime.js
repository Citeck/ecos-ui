import React from 'react';
import ReactDOM from 'react-dom';
import BaseComponent from 'formiojs/components/base/Base';
import DatePicker from '../../../../components/common/form/DatePicker';

export default class DateTimeComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'React DateTime',
        key: 'reactDatetime',
        type: 'reactDatetime',
        mask: false,
        inputType: 'text'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'React DateTime',
      icon: 'fa fa-calendar',
      group: 'basic',
      weight: 0,
      schema: DateTimeComponent.schema()
    };
  }

  get defaultSchema() {
    return DateTimeComponent.schema();
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

    this.reactComponentInitConfig = {
      disabled: this.disabled,
      placeholderText: this.component.placeholder,
      dateFormat: this.component.dateFormat
    };

    this.renderReactComponent();

    this.errorContainer = this.element;
    this.createErrorElement();

    // this.setInputStyles(this.inputsContainer);

    if (labelAtTheBottom) {
      this.createLabel(this.element);
    }

    this.createDescription(this.element);

    // this.attachLogic();
  }

  renderReactComponent(config = {}) {
    const onChange = this.onValueChange.bind(this);
    const otherProps = { ...this.reactComponentInitConfig, ...config };

    ReactDOM.render(<DatePicker showIcon selected={this.dataValue} onChange={onChange} {...otherProps} />, this.reactContainer);
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
    return null;
  }

  getValue() {
    return this.dataValue;
  }

  setValue(value) {
    this.dataValue = value ? new Date(value) : null;
    this.refreshDOM();
  }
}
