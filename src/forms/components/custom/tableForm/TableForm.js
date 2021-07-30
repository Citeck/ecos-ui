import _ from 'lodash';
import BaseReactComponent from '../base/BaseReactComponent';
import TableForm from '../../../../components/common/form/TableForm';
import EcosFormUtils from '../../../../components/EcosForm/EcosFormUtils';
import Records from '../../../../components/Records';
import JournalsService from '../../../../components/Journals/service';
import DialogManager from '../../../../components/common/dialogs/Manager';
import { t } from '../../../../helpers/util';
import ecosFetch from '../../../../helpers/ecosFetch';

const Labels = {
  MSG_NO_J_ID: 'ecos-table-form.error.no-journal-id',
  MSG_NO_J_CONFIG: 'ecos-table-form.error.no-journal-config',
  MSG_ERR_SOURCE: 'ecos-table-form.error.source',
  MSG_NO_HANDLER: 'ecos-table-form.error.no-response-handler',
  MSG_FAIL_IMPORT: 'ecos-table-form.error.failure-to-import',
  DIALOG_TITLE: 'ecos-table-form.error-dialog.title'
};

export default class TableFormComponent extends BaseReactComponent {
  _selectedRows = [];
  _displayElementsValue = {};
  _nonSelectableRows = [];
  _createVariants = [];

  #journalConfig;

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
        isUsedJournalActions: false,
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
    const { displayElementsJS, nonSelectableRowsJS, selectedRowsJS, customCreateVariantsJs } = this.component;

    if (displayElementsJS) {
      let displayElements = this.evaluate(displayElementsJS, {}, 'value', true);
      if (!_.isEqual(displayElements, this._displayElementsValue)) {
        this._displayElementsValue = displayElements;
        this.setReactProps({
          displayElements
        });
      }
    }

    if (nonSelectableRowsJS) {
      let nonSelectableRows = this.evaluate(nonSelectableRowsJS, {}, 'value', true);
      if (!_.isEqual(nonSelectableRows, this._nonSelectableRows)) {
        this._nonSelectableRows = nonSelectableRows;
        this.setReactProps({
          nonSelectableRows
        });
      }
    }

    if (selectedRowsJS) {
      let selectedRows = this.evaluate(selectedRowsJS, {}, 'value', true);
      if (!_.isEqual(selectedRows, this._selectedRows)) {
        this._selectedRows = selectedRows;
        this.setReactProps({
          selectedRows
        });
      }
    }

    if (customCreateVariantsJs) {
      const createVariantsResult = this._getCustomCreateVariants();
      createVariantsResult.then(createVariants => {
        if (!createVariants) {
          return;
        }

        if (!_.isEqual(createVariants, this._createVariants)) {
          this._createVariants = createVariants;
          this.setReactProps({
            createVariants
          });
        }
      });
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

    if (!_.isEmpty(value)) {
      this._fetchActions(value).then(journalActions => this.setReactProps({ journalActions }));
    }

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

  async _getCustomCreateVariants() {
    const { customCreateVariantsJs } = this.component;

    let customCreateVariants = null;
    if (customCreateVariantsJs) {
      try {
        customCreateVariants = this.evaluate(customCreateVariantsJs, {}, 'value', true);
      } catch (e) {
        console.error(e);
      }
    }

    let createVariantsPromise = Promise.resolve(null);
    if (customCreateVariants) {
      let fetchCustomCreateVariantsPromise = Promise.resolve([]);

      if (customCreateVariants.then) {
        fetchCustomCreateVariantsPromise = customCreateVariants;
      } else {
        fetchCustomCreateVariantsPromise = Promise.resolve(customCreateVariants);
      }

      const variants = await fetchCustomCreateVariantsPromise;

      createVariantsPromise = Promise.all(
        variants.map(variant => {
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
    }

    return createVariantsPromise;
  }

  _fetchAsyncProperties = source => {
    return new Promise(async resolve => {
      if (!source) {
        return resolve({ error: new Error('Empty source') });
      }

      const attribute = this.getAttributeToEdit();

      switch (source.type) {
        case 'journal':
          const { journal } = source;
          const journalId = await (journal.journalId ||
            this.getRecord()
              .loadEditorKey(attribute)
              .catch(() => null));
          const displayColumns = journal.columns;

          if (!journalId) {
            return resolve({ error: new Error(t(Labels.MSG_NO_J_ID)) });
          }

          try {
            const journalConfig = await JournalsService.getJournalConfig(journalId);
            let columns = journalConfig.columns;

            this.#journalConfig = journalConfig;
            this._createVariants = journalConfig.meta.createVariants || [];

            if (Array.isArray(displayColumns) && displayColumns.length > 0) {
              columns = columns.map(item => ({ ...item, default: displayColumns.indexOf(item.attribute) !== -1 }));
            }

            resolve({ columns: await JournalsService.resolveColumns(columns) });
          } catch (error) {
            console.error(error);
            return resolve({ error: new Error(t(Labels.MSG_NO_J_CONFIG)) });
          }
          break;
        case 'custom':
          const record = this.getRecord();
          const columns = (_.get(source, 'custom.columns') || []).map(item => {
            const col = { ...item };
            if (item.formatter) {
              col.formatter = this.evaluate(item.formatter, {}, 'value', true);
            }
            return col;
          });

          const customCreateVariants = await this._getCustomCreateVariants();
          let createVariantsPromise = Promise.resolve([]);
          if (customCreateVariants) {
            createVariantsPromise = customCreateVariants;
          } else if (attribute) {
            createVariantsPromise = EcosFormUtils.getCreateVariants(record, attribute);
          }

          try {
            const createVariants = await createVariantsPromise;
            this._createVariants = createVariants;

            const columnsMap = {};
            const formatters = {};

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

            const result = await Promise.all([columnsInfoPromise, inputsPromise]).catch(err => {
              console.error(err);
              return [columns, {}];
            });

            const [updColumns = [], inputs = {}] = result;

            for (let col of updColumns) {
              let input = inputs[col.attribute] || {};
              let computedDispName = _.get(input, 'component.computed.valueDisplayName', '');

              if (computedDispName) {
                //todo Is this filter required?
                col.formatter = {
                  name: 'FormFieldFormatter',
                  params: input
                };
              }

              if (formatters.hasOwnProperty(col.attribute)) {
                col.newFormatter = formatters[col.attribute];
              }
            }

            resolve({
              columns: await JournalsService.resolveColumns(updColumns)
            });
          } catch (error) {
            console.error(error);
            return resolve({ error: new Error(`Can't fetch create variants: ${error.message}`) });
          }
          break;
        default:
          return resolve({ error: new Error(t(Labels.MSG_ERR_SOURCE)) });
      }
    });
  };

  _fetchActions = records => {
    if (!this.component.isUsedJournalActions || !this.#journalConfig) {
      return Promise.resolve({});
    }

    return new Promise(async resolve =>
      resolve(await JournalsService.getRecordActions(this.#journalConfig, records || []).catch(() => ({})))
    );
  };

  getInitialReactProps() {
    const component = this.component;

    let resolveProps = props => {
      const { columns = [], error, journalActions } = props || {};

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

      const placeholder = this.t(component.placeholder);
      const customStringForConcatWithStaticTitle = this.t(component.customStringForConcatWithStaticTitle);

      return {
        columns,
        journalActions,
        error,
        createVariants: this._createVariants,
        defaultValue: this.dataValue,
        isCompact: component.isCompact,
        multiple: component.multiple,
        placeholder,
        disabled: component.disabled,
        noColHeaders: component.noColHeaders,
        isStaticModalTitle: component.isStaticModalTitle,
        customStringForConcatWithStaticTitle,
        onChange: this.onReactValueChanged,
        isSelectableRows: component.isSelectableRows,
        onSelectRows: this._setSelectedRows,
        viewOnly: this.viewOnly,
        parentForm: this.root,
        triggerEventOnTableChange,
        displayElements: this._displayElementsValue,
        isUsedJournalActions: component.isUsedJournalActions,
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

    return this._fetchAsyncProperties(component.source)
      .then(async props => ({ ...props, journalActions: await this._fetchActions(this.dataValue) }))
      .then(resolveProps);
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
      return this.showErrorMessage(t(Labels.MSG_NO_HANDLER));
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
      this.showErrorMessage(t(Labels.MSG_FAIL_IMPORT));
    }
  };

  showErrorMessage = text => {
    DialogManager.showInfoDialog({
      title: t(Labels.DIALOG_TITLE),
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
