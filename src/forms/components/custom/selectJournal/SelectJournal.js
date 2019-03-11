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

    ReactDOM.render(
      <SelectJournal
        multiple={this.component.multiple}
        onChange={onChange}
        journalId={'legal-entities'} // TODO config
        createFormRecord={'dict@idocs:legalEntity'} // TODO config
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
    let newValue = value;

    if (!this.component.multiple) {
      if (Array.isArray(value) && value.length > 0) {
        newValue = value[0];
      } else {
        newValue = null;
      }
    }

    this.dataValue = newValue;
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
    this.dataValue = value || this.emptyValue;
    this.refreshDOM();
  }
}
