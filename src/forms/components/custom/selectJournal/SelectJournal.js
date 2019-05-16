import React from 'react';
import ReactDOM from 'react-dom';
import BaseComponent from '../base/BaseComponent';
import SelectJournal from '../../../../components/common/form/SelectJournal';

export default class SelectJournalComponent extends BaseComponent {
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
      schema: SelectJournalComponent.schema()
    };
  }

  get defaultSchema() {
    return SelectJournalComponent.schema();
  }

  createViewOnlyValue(container) {
    this.reactContainer = this.ce('dd');
    container.appendChild(this.reactContainer);
    this.renderReactComponent();
  }

  build() {
    if (this.viewOnly) {
      return this.viewOnlyBuild();
    }

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
          defaultValue={self.dataValue}
          isCompact={component.isCompact}
          multiple={component.multiple}
          placeholder={component.placeholder}
          disabled={component.disabled}
          journalId={journalId}
          onChange={onChange}
          viewOnly={self.viewOnly}
          displayColumns={component.displayColumns}
          hideCreateButton={component.hideCreateButton}
          onError={err => {
            // this.setCustomValidity(err, false);
          }}
        />,
        self.reactContainer
      );
    };

    let journalId = this.component.journalId;

    if (!journalId) {
      let attribute = this.getAttributeToEdit();
      this.getRecord()
        .loadEditorKey(attribute)
        .then(editorKey => {
          this.component._journalId = editorKey;
          renderControl(editorKey);
        })
        .catch(() => {
          renderControl(null);
        });
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
    if (this.reactContainer && value !== this.dataValue) {
      ReactDOM.unmountComponentAtNode(this.reactContainer);
    }

    this.dataValue = value || this.component.defaultValue || this.emptyValue;
    this.refreshDOM();
  }
}
