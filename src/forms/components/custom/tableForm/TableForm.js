import _ from 'lodash';
import BaseReactComponent from '../base/BaseReactComponent';
import TableForm from '../../../../components/common/form/TableForm';
import EcosFormUtils from '../../../../components/EcosForm/EcosFormUtils';
import Records from '../../../../components/Records';
import { JournalsApi } from '../../../../api/journalsApi';
import GqlDataSource from '../../../../components/common/grid/dataSource/GqlDataSource';
import DialogManager from '../../../../components/common/dialogs/Manager';
import { t } from '../../../../helpers/util';
import ecosFetch from '../../../../helpers/ecosFetch';

export default class TableFormComponent extends BaseReactComponent {
  _selectedRows = [];
  _displayElementsValue = {};
  _nonSelectableRows = [];

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
            columns: [],
            record: null,
            attribute: null
          }
        },
        computed: {
          valueFormKey: ''
        },
        customCreateVariantsJs: '',
        noColHeaders: false,
        isStaticModalTitle: false,
        customStringForConcatWithStaticTitle: '',
        isSelectableRows: false,
        displayElementsJS: '',
        nonSelectableRowsJS: '',
        selectedRowsJS: '',
        import: {
          enable: false,
          uploadUrl: '',
          responseHandler: ''
        },
        triggerEventOnChange: false,
        isInstantClone: false,
        defaultValue: []
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

  checkConditions(data) {
    let result = super.checkConditions(data);

    if (this.component.displayElementsJS) {
      let displayElements = this.evaluate(this.component.displayElementsJS, {}, 'value', true);
      if (!_.isEqual(displayElements, this._displayElementsValue)) {
        this._displayElementsValue = displayElements;
        this.setReactProps({
          displayElements
        });
      }
    }

    if (this.component.nonSelectableRowsJS) {
      let nonSelectableRows = this.evaluate(this.component.nonSelectableRowsJS, {}, 'value', true);
      if (!_.isEqual(nonSelectableRows, this._nonSelectableRows)) {
        this._nonSelectableRows = nonSelectableRows;
        this.setReactProps({
          nonSelectableRows
        });
      }
    }

    if (this.component.selectedRowsJS) {
      let selectedRows = this.evaluate(this.component.selectedRowsJS, {}, 'value', true);
      if (!_.isEqual(selectedRows, this._selectedRows)) {
        this._selectedRows = selectedRows;
        this.setReactProps({
          selectedRows
        });
      }
    }

    return result;
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

  getValueFormKey(value) {
    let formKeyJs = _.get(this.component, 'computed.valueFormKey', null);

    if (formKeyJs) {
      let model = { _ };

      let recordsOwnerId;

      if (_.isString(value)) {
        recordsOwnerId = 'owner-' + this.component.id + '-' + this.component.key;
        let recordId = value[0] === '{' ? EcosFormUtils.initJsonRecord(value, this.id, recordsOwnerId) : value;
        model.record = Records.get(recordId);
      } else {
        model.record = value;
      }

      try {
        return this.evaluate(formKeyJs, model, 'value', true);
      } finally {
        Records.releaseAll(recordsOwnerId);
      }
    } else {
      return null;
    }
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

  getAttributeToEdit() {
    return (this.component.properties || {}).attribute;
  }

  refreshElementHasValueClasses() {
    if (!this.element) {
      return;
    }

    const isMultiple = this.component.multiple;

    const viewOnlyHasValueClassName = 'formio-component__view-only-table-has-rows';
    const hasValue = isMultiple ? Array.isArray(this.dataValue) && this.dataValue.length > 0 : !!this.dataValue;
    const elementHasClass = this.element.classList.contains(viewOnlyHasValueClassName);

    if (!hasValue && elementHasClass) {
      this.element.classList.remove(viewOnlyHasValueClassName);
    } else if (hasValue && !elementHasClass) {
      this.element.classList.add(viewOnlyHasValueClassName);
    }
  }

  _setSelectedRows = selectedRows => {
    this._selectedRows = selectedRows;
    this.setReactProps({
      selectedRows
    });
  };

  getSelectedRows = () => {
    return this._selectedRows;
  };

  _fetchAsyncProperties = source => {
    return new Promise(async resolve => {
      if (!source) {
        return resolve({ error: new Error('Empty source') });
      }

      switch (source.type) {
        case 'journal':
          const { journal } = source;

          let fetchJournalIdPromise;
          if (!journal.journalId) {
            fetchJournalIdPromise = new Promise(resolve1 => {
              const attribute = this.getAttributeToEdit();
              return this.getRecord()
                .loadEditorKey(attribute)
                .then(resolve1)
                .catch(() => {
                  resolve1(null);
                });
            });
          } else {
            fetchJournalIdPromise = Promise.resolve(journal.journalId);
          }

          const journalId = await fetchJournalIdPromise;
          if (!journalId) {
            return resolve({ error: new Error(t('ecos-table-form.error.no-journal-id')) });
          }

          const journalsApi = new JournalsApi();
          const displayColumns = journal.columns;

          try {
            const journalConfig = await journalsApi.getJournalConfig(journalId);
            let columns = journalConfig.columns;
            if (Array.isArray(displayColumns) && displayColumns.length > 0) {
              columns = columns.map(item => {
                return {
                  ...item,
                  default: displayColumns.indexOf(item.attribute) !== -1
                };
              });
            }

            resolve({
              createVariants: journalConfig.meta.createVariants || [],
              columns: GqlDataSource.getColumnsStatic(columns)
            });
          } catch (e) {
            return resolve({ error: new Error(`Can't fetch journal config: ${e.message}`) });
          }
          break;
        case 'custom':
          const component = this.component;
          const record = this.getRecord();
          const attribute = this.getAttributeToEdit();
          const columns = source.custom.columns.map(item => {
            const col = { ...item };
            if (item.formatter) {
              col.formatter = this.evaluate(item.formatter, {}, 'value', true);
            }
            return col;
          });

          let customCreateVariants = null;
          if (component.customCreateVariantsJs) {
            try {
              customCreateVariants = this.evaluate(component.customCreateVariantsJs, {}, 'value', true);
            } catch (e) {
              console.error(e);
            }
          }

          let createVariantsPromise = Promise.resolve([]);
          if (customCreateVariants) {
            let fetchCustomCreateVariantsPromise;
            if (customCreateVariants.then) {
              fetchCustomCreateVariantsPromise = customCreateVariants;
            } else {
              fetchCustomCreateVariantsPromise = Promise.resolve(customCreateVariants);
            }
            createVariantsPromise = Promise.all(
              (await fetchCustomCreateVariantsPromise).map(variant => {
                if (_.isObject(variant)) {
                  return variant;
                }

                return Records.get(variant)
                  .load('.disp')
                  .then(dispName => {
                    return {
                      recordRef: variant,
                      label: dispName
                    };
                  });
              })
            );
          } else if (attribute) {
            createVariantsPromise = EcosFormUtils.getCreateVariants(record, attribute);
          }

          try {
            const createVariants = await createVariantsPromise;
            let columnsMap = {};
            let formatters = {};
            columns.forEach(item => {
              const key = `.edge(n:"${item.name}"){title,type,multiple}`;
              columnsMap[key] = item;
              if (item.formatter) {
                formatters[item.name] = item.formatter;
              }
            });

            let columnsInfoPromise;
            let inputsPromise;

            let spareCreateVariants = [];
            if (!Array.isArray(createVariants) || createVariants.length < 1) {
              if (customCreateVariants && attribute) {
                spareCreateVariants = await EcosFormUtils.getCreateVariants(record, attribute);
              }
            }

            if (createVariants.length < 1 && spareCreateVariants.length < 1) {
              columnsInfoPromise = Promise.resolve(
                columns.map(item => {
                  return {
                    default: true,
                    type: item.type,
                    text: item.title ? this.t(item.title) : '',
                    multiple: item.multiple,
                    attribute: item.name
                  };
                })
              );
              inputsPromise = Promise.resolve({});
            } else {
              const firstCreateVariant = _.get(createVariants, '[0]', _.get(spareCreateVariants, '[0]'));
              let cvRecordRef = firstCreateVariant.recordRef;
              columnsInfoPromise = Records.get(cvRecordRef)
                .load(Object.keys(columnsMap))
                .then(loadedAtt => {
                  let cols = [];
                  for (let i in columnsMap) {
                    if (!columnsMap.hasOwnProperty(i)) {
                      continue;
                    }

                    const originalColumn = columnsMap[i];
                    const isManualAttributes = originalColumn.setAttributesManually;

                    cols.push({
                      default: true,
                      type: isManualAttributes && originalColumn.type ? originalColumn.type : loadedAtt[i].type,
                      text: isManualAttributes && originalColumn.title ? this.t(originalColumn.title) : loadedAtt[i].title,
                      multiple: isManualAttributes ? originalColumn.multiple : loadedAtt[i].multiple,
                      attribute: originalColumn.name
                    });
                  }

                  return cols;
                });

              inputsPromise = EcosFormUtils.getRecordFormInputsMap(cvRecordRef);
            }

            Promise.all([columnsInfoPromise, inputsPromise])
              .then(columnsAndInputs => {
                let [columns, inputs] = columnsAndInputs;

                for (let column of columns) {
                  let input = inputs[column.attribute] || {};
                  let computedDispName = _.get(input, 'component.computed.valueDisplayName', '');

                  if (computedDispName) {
                    //Is this filter required?
                    column.formatter = {
                      name: 'FormFieldFormatter',
                      params: input
                    };
                  }

                  if (formatters.hasOwnProperty(column.attribute)) {
                    column.formatter = formatters[column.attribute];
                  }
                }

                resolve({
                  createVariants,
                  columns: GqlDataSource.getColumnsStatic(columns)
                });
              })
              .catch(err => {
                console.error(err);
                columnsInfoPromise.then(columns => {
                  resolve({
                    createVariants,
                    columns: GqlDataSource.getColumnsStatic(columns)
                  });
                });
              });
          } catch (e) {
            return resolve({ error: new Error(`Can't fetch create variants: ${e.message}`) });
          }
          break;
        default:
          return resolve({ error: new Error(`Invalid source type`) });
      }
    });
  };

  getInitialReactProps() {
    const component = this.component;

    let resolveProps = props => {
      const { createVariants = [], columns = [], error } = props || {};

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
        createVariants,
        columns,
        error,
        defaultValue: this.dataValue,
        isCompact: component.isCompact,
        multiple: component.multiple,
        placeholder: component.placeholder,
        disabled: component.disabled,
        noColHeaders: component.noColHeaders,
        isStaticModalTitle: component.isStaticModalTitle,
        customStringForConcatWithStaticTitle: this.t(component.customStringForConcatWithStaticTitle),
        onChange: this.onReactValueChanged,
        isSelectableRows: component.isSelectableRows,
        onSelectRows: this._setSelectedRows,
        viewOnly: this.viewOnly,
        parentForm: this.root,
        triggerEventOnTableChange,
        displayElements: this._displayElementsValue,
        settingElements: {
          isInstantClone: component.isInstantClone
        },
        nonSelectableRows: this._nonSelectableRows,
        selectedRows: this._selectedRows,
        importButton: {
          enable: component.import.enable,
          onChange: this.importFiles
        },
        computed: {
          valueFormKey: value => this.getValueFormKey(value)
        }
      };
    };

    return this._fetchAsyncProperties(component.source).then(resolveProps);
  }

  importFiles = fileList => {
    for (let i = 0; i < fileList.length; i++) {
      this.uploadFile(fileList.item(i));
    }
  };

  uploadFile = async file => {
    const component = this.component;
    const importConfig = component.import;
    const { uploadUrl, responseHandler } = importConfig;

    if (!responseHandler) {
      return this.showErrorMessage(t('ecos-table-form.error.no-response-handler'));
    }

    const formData = new FormData();
    formData.append(file.name, file);

    try {
      const response = await ecosFetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      const handledResult = this.evaluate(responseHandler, { response: result, resp: result }, 'result', true);
      if (handledResult instanceof Error) {
        return this.showErrorMessage(handledResult.message);
      }

      const currentValue = this.getValue();
      let newValue;
      if (Array.isArray(handledResult)) {
        newValue = currentValue.concat(handledResult);
      } else {
        newValue = [...currentValue, handledResult];
      }

      this.updateValue({}, newValue);
    } catch (e) {
      console.error('TableForm error. Failure to upload file: ', e.message);
      this.showErrorMessage(t('ecos-table-form.error.failure-to-import'));
    }
  };

  showErrorMessage = text => {
    DialogManager.showInfoDialog({
      title: t('ecos-table-form.error-dialog.title'),
      text
    });
  };

  static optimizeSchema(comp) {
    return _.omit(
      {
        ...comp,
        source: _.omitBy(comp.source, (value, key) => {
          const saveAtts = ['type'];
          if (saveAtts.includes(key)) {
            return false;
          }
          return key !== comp.source.type;
        })
      },
      ['displayColumnsAsyncData']
    );
  }
}
