import React from 'react';
import ReactDOM from 'react-dom';
import BaseComponent from 'formiojs/components/base/Base';
import SelectJournal from '../../../../components/common/form/SelectJournal';
import Records from '../../../../components/Records';

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
    let self = this;
    let component = this.component;

    const onChange = this.onValueChange.bind(this);

    let renderControl = function(journalId) {
      ReactDOM.render(
        <SelectJournal
          defaultValue={component.defaultValue}
          isCompact={component.isCompact}
          multiple={component.multiple}
          placeholder={component.placeholder}
          disabled={component.disabled}
          journalId={journalId}
          onChange={onChange}
          onError={err => {
            // this.setCustomValidity(err, false);
          }}
        />,
        self.reactContainer
      );
    };

    let journalId = this.component.journalId;
    if (!journalId) {
      let recordId = this.root.options.recordId;
      let attribute = (this.component.properties || {}).attribute;

      if (recordId && attribute && attribute[0] !== '.') {
        let record = Records.get(recordId);
        record
          .load({
            editorKey: '#' + attribute + '?editorKey'
          })
          .then(atts => {
            renderControl(atts.editorKey);
          })
          .catch(e => {
            console.error(e);
            renderControl(null);
          });
      } else {
        renderControl(null);
      }
    } else {
      renderControl(journalId);
    }
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
    this.dataValue = value || this.emptyValue;
    this.refreshDOM();
  }
}
