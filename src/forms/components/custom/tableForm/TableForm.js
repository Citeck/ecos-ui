import BaseReactComponent from '../base/BaseReactComponent';
import TableForm from '../../../../components/common/form/TableForm';
import lodashGet from 'lodash/get';

export default class TableFormComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'TableForm',
        key: 'tableForm',
        type: 'tableForm',
        eventName: '',
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
        },
        isStaticModalTitle: false
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
      schema: TableFormComponent.schema()
    };
  }

  get defaultSchema() {
    return TableFormComponent.schema();
  }

  get emptyValue() {
    return [];
  }

  getComponentToRender() {
    return TableForm;
  }

  setReactValue(component, value) {
    this.setReactProps({
      defaultValue: value
    });
  }

  viewOnlyBuild() {
    super.viewOnlyBuild();
    this.refreshElementHasValueClasses();
  }

  updateValue(flags, value) {
    const changed = super.updateValue(flags, value);

    this.refreshElementHasValueClasses();

    return changed;
  }

  refreshElementHasValueClasses() {
    if (!this.element) {
      return;
    }

    const viewOnlyHasValueClassName = 'formio-component-tableForm_viewOnly-hasValue';
    const hasValue = Array.isArray(this.dataValue) && this.dataValue.length > 0;
    const elementHasClass = this.element.classList.contains(viewOnlyHasValueClassName);

    if (!hasValue && elementHasClass) {
      this.element.classList.remove(viewOnlyHasValueClassName);
    } else if (hasValue && !elementHasClass) {
      this.element.classList.add(viewOnlyHasValueClassName);
    }
  }

  getInitialReactProps() {
    const component = this.component;

    let resolveProps = source => {
      let triggerEventOnTableChange = null;
      if (component.eventName) {
        triggerEventOnTableChange = () => {
          this.emit(this.interpolate(component.eventName), this.data);
          this.events.emit(this.interpolate(component.eventName), this.data);
          this.emit('customEvent', {
            type: this.interpolate(component.eventName),
            component: this.component,
            data: this.data,
            event: null
          });
        };
      }

      return {
        defaultValue: this.dataValue,
        isCompact: component.isCompact,
        multiple: component.multiple,
        placeholder: component.placeholder,
        disabled: component.disabled,
        isStaticModalTitle: component.isStaticModalTitle,
        source: source,
        onChange: this.onReactValueChanged,
        viewOnly: this.viewOnly,
        parentForm: this.root,
        triggerEventOnTableChange,
        onError: err => {
          // this.setCustomValidity(err, false);
        }
      };
    };

    const source = component.source;

    switch (source.type) {
      case 'journal':
        let journalId = lodashGet(component, 'source.journal.journalId', null);

        if (!journalId) {
          let attribute = this.getAttributeToEdit();
          return this.getRecord()
            .loadEditorKey(attribute)
            .then(editorKey => {
              this.component._journalId = editorKey;
              return resolveProps({
                ...source,
                journal: {
                  ...source.journal,
                  journalId: editorKey
                }
              });
            });
        } else {
          return resolveProps(source);
        }
      case 'custom':
        return resolveProps({
          ...source,
          custom: {
            ...source.custom,
            record: this.getRecord(),
            attribute: this.getAttributeToEdit(),
            columns: source.custom.columns.map(item => item.name || item)
          }
        });
      default:
        return resolveProps(null);
    }
  }
}
