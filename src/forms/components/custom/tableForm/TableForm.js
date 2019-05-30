import React from 'react';
import ReactDOM from 'react-dom';
import BaseComponent from '../base/BaseComponent';
import TableForm from '../../../../components/common/form/TableForm';
import isEqual from 'lodash/isEqual';
import lodashGet from 'lodash/get';

export default class SelectOrgstructComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'TableForm',
        key: 'tableForm',
        type: 'tableForm',
        source: {
          type: '',
          journal: {
            journalId: null,
            columns: []
          },
          custom: {
            createVariants: [],
            columns: [],
            record: null,
            attribute: null
          }
        }
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Table Form',
      icon: 'fa fa-th-list',
      group: 'advanced',
      weight: 0,
      schema: SelectOrgstructComponent.schema()
    };
  }

  get defaultSchema() {
    return SelectOrgstructComponent.schema();
  }

  viewOnlyBuild() {} // hide control for viewOnly mode

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
    const component = this.component;
    const onChange = this.onValueChange.bind(this);

    const renderControl = source => {
      ReactDOM.render(
        <TableForm
          defaultValue={this.dataValue}
          isCompact={component.isCompact}
          multiple={component.multiple}
          placeholder={component.placeholder}
          disabled={component.disabled}
          onChange={onChange}
          viewOnly={this.viewOnly}
          source={source}
          onError={err => {
            // this.setCustomValidity(err, false);
          }}
        />,
        this.reactContainer
      );
    };

    const source = component.source;

    switch (source.type) {
      case 'journal':
        let journalId = lodashGet(component, 'source.journal.journalId', null);

        if (!journalId) {
          let attribute = this.getAttributeToEdit();
          this.getRecord()
            .loadEditorKey(attribute)
            .then(editorKey => {
              this.component._journalId = editorKey;
              renderControl({
                ...source,
                journal: {
                  ...source.journal,
                  journalId: editorKey
                }
              });
            });
        } else {
          renderControl(source);
        }
        break;
      case 'custom':
        renderControl({
          ...source,
          custom: {
            ...source.custom,
            record: this.getRecord(),
            attribute: this.getAttributeToEdit(),
            columns: source.custom.columns.map(item => item.name || item)
          }
        });
        break;
      default:
        console.log('TableForm empty source');
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
    // return this.component.multiple ? [] : null;
    return [];
  }

  getValue() {
    return this.dataValue;
  }

  setValue(value) {
    if (this.reactContainer && !isEqual(value, this.dataValue)) {
      ReactDOM.unmountComponentAtNode(this.reactContainer);
    }

    this.dataValue = value || this.component.defaultValue || this.emptyValue;
    this.refreshDOM();
  }
}
