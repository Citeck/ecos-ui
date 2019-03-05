import React from 'react';
import ReactDOM from 'react-dom';
import BaseComponent from 'formiojs/components/base/Base';
import SelectJournal from '../../../../components/common/form/SelectJournal';

export default class DateTimeComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'SelectJournal',
        key: 'selectJournal',
        type: 'selectJournal',
        mask: false
        // inputType: 'text'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Select Journal',
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
      disabled: this.disabled
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

    ReactDOM.render(<SelectJournal onChange={onChange} />, this.reactContainer);
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
    this.dataValue = value || null;
    this.refreshDOM();
  }
}
