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
        type: 'selectJournal'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Select Journal',
      icon: 'fa fa-th-list',
      group: 'advanced',
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
    const onChange = this.onValueChange.bind(this);

    ReactDOM.render(
      <SelectJournal
        value={this.dataValue}
        isCompact={this.component.isCompact}
        multiple={this.component.multiple}
        placeholder={this.component.placeholder}
        disabled={this.component.disabled}
        journalId={this.component.journalId}
        createFormRecord={this.component.createFormRecord}
        onChange={onChange}
        onError={err => {
          // this.setCustomValidity(err, false);
        }}
      />,
      this.reactContainer
    );
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
    return [];
  }

  getValue() {
    return this.dataValue;
  }

  setValue(value) {
    this.dataValue = value || this.emptyValue;
    this.refreshDOM();
  }
}
