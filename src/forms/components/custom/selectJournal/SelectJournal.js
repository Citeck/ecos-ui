import { evaluate as formioEvaluate } from 'formiojs/utils/utils';
import _ from 'lodash';

import BaseReactComponent from '../base/BaseReactComponent';

import { DataTypes, DisplayModes, SortOrderOptions, TableTypes, TEMPLATE_REGEX } from './constants';

import EcosFormUtils from '@/components/EcosForm/EcosFormUtils';
import Records from '@/components/Records';
import SelectJournal from '@/components/common/form/SelectJournal';
import GqlDataSource from '@/components/common/grid/dataSource/GqlDataSource';
import { getTextByLocale, trimFields } from '@/helpers/util';

export default class SelectJournalComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'SelectJournal',
        key: 'selectJournal',
        type: 'selectJournal',
        customPredicateJs: '',
        customActionRefs: [],
        queryData: null,
        queryDataJs: '',
        presetFilterPredicatesJs: '',
        hideCreateButton: false,
        hideEditRowButton: false,
        hideDeleteRowButton: false,
        enableCreateButton: false,
        isFullScreenWidthModal: false,
        isSelectedValueAsText: false,
        isTableMode: false,
        sortAttribute: '',
        sortAscending: SortOrderOptions.DESC.value,
        source: {
          custom: {
            columns: []
          },
          type: TableTypes.JOURNAL,
          viewMode: DisplayModes.DEFAULT,
          customValues: []
        },
        displayColumns: [],
        computed: {
          valueDisplayName: ''
        },
        searchField: '',
        ecos: {
          dataType: DataTypes.ASSOC
        }
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

  get journalId() {
    let journalId = this.component.journalId || '';

    const matches = journalId.match(TEMPLATE_REGEX);

    if (!matches) {
      return journalId;
    }

    matches.forEach(matchString => {
      const stringWithoutBraskets = matchString.substring(2, matchString.length - 1);
      journalId = journalId.replace(matchString, this.root.data[stringWithoutBraskets]);
    });

    return journalId || this.component.journalId;
  }

  checkConditions(data) {
    const result = super.checkConditions(data);

    if (!this.component.customPredicateJs) {
      return result;
    }

    const customPredicate = this.evaluate(this.component.customPredicateJs, {}, 'value', true);

    if (!_.isEqual(customPredicate, this.customPredicateValue)) {
      this.customPredicateValue = customPredicate;

      if (this.react && this.react.innerComponent) {
        this.react.innerComponent.setCustomPredicate && this.react.innerComponent.setCustomPredicate(customPredicate);
      } else {
        this.updateReactComponent(component => component.setCustomPredicate && component.setCustomPredicate(customPredicate));
      }
    }

    return result;
  }

  getComponentToRender() {
    return SelectJournal;
  }

  fetchAsyncProperties = source => {
    return new Promise(async resolve => {
      if (!source || source.viewMode !== DisplayModes.TABLE) {
        return resolve([]);
      }

      if (source.type === TableTypes.CUSTOM) {
        const component = this.component;
        const record = this.getRecord();
        const attribute = this.getAttributeToEdit();

        let customCreateVariants = null;
        let createVariantsPromise = Promise.resolve([]);

        const columns = await Promise.all(
          source.custom.columns.map(async item => {
            const col = { ...item };
            let additionalInfo = {};

            if (!col.type || !col.title) {
              additionalInfo = await record.load(`.edge(n:"${item.name}"){title,type,multiple}`);
            }

            if (item.formatter) {
              col.formatter = this.evaluate(item.formatter, {}, 'value', true);
            }

            return { ...col, ...additionalInfo };
          })
        );

        if (component.customCreateVariantsJs) {
          try {
            customCreateVariants = this.evaluate(component.customCreateVariantsJs, {}, 'value', true);
          } catch (e) {
            console.error("[SelectJournal fetchAsyncProperties] Can't fetch Custom create variants", e);
          }
        }

        if (customCreateVariants) {
          let fetchCustomCreateVariantsPromise;

          if (_.isFunction(customCreateVariants.then)) {
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
                .then(dispName => ({
                  recordRef: variant,
                  label: dispName
                }));
            })
          );
        } else if (attribute) {
          createVariantsPromise = EcosFormUtils.getCreateVariants(record, attribute);
        }

        try {
          const createVariants = await createVariantsPromise;
          const columnsMap = {};
          const formatters = {};

          let columnsInfoPromise;
          let inputsPromise;

          columns.forEach(item => {
            const key = `.edge(n:"${item.name}"){title,type,multiple}`;

            columnsMap[key] = item;

            if (item.formatter) {
              formatters[item.name] = item.formatter;
            }
          });

          if (createVariants.length < 1 || columns.length < 1) {
            columnsInfoPromise = await Promise.all(
              columns.map(async item => {
                let data = item;
                const text = item.title ? this.t(item.title) : '';

                return {
                  default: true,
                  type: data.type,
                  text: text || data.title,
                  multiple: data.multiple,
                  attribute: data.name
                };
              })
            );
            inputsPromise = Promise.resolve({});
          } else {
            const cvRecordRef = createVariants[0].recordRef;

            columnsInfoPromise = Records.get(cvRecordRef)
              .load(Object.keys(columnsMap))
              .then(loadedAtt => {
                const cols = [];

                for (let i in columnsMap) {
                  if (!columnsMap.hasOwnProperty(i)) {
                    continue;
                  }

                  const originalColumn = columnsMap[i];
                  const isManualAttributes = originalColumn.setAttributesManually;

                  cols.push({
                    default: true,
                    type: isManualAttributes && originalColumn.type ? originalColumn.type : loadedAtt[i].type,
                    text: isManualAttributes ? this.t(originalColumn.title) : loadedAtt[i].title,
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
              const [columns, inputs] = columnsAndInputs;

              for (let column of columns) {
                const input = inputs[column.attribute] || {};
                const computedDispName = _.get(input, 'component.computed.valueDisplayName', '');

                if (computedDispName) {
                  //todo: Is this filter required?
                  column.formatter = {
                    name: 'FormFieldFormatter',
                    params: input
                  };
                }

                if (formatters.hasOwnProperty(column.attribute)) {
                  column.formatter = formatters[column.attribute];
                }
              }

              resolve(GqlDataSource.getColumnsStatic(columns));
            })
            .catch(err => {
              console.warn("[SelectJournal fetchAsyncProperties] Can't fetch Columns & Fields", err);
              columnsInfoPromise.then(columns => resolve(GqlDataSource.getColumnsStatic(columns)));
            });
        } catch (e) {
          console.warn("[SelectJournal fetchAsyncProperties] Can't fetch Create variants", e);
          return resolve([]);
        }
      } else {
        resolve([]);
      }
    });
  };

  get modalTitle() {
    let modalTitle = _.cloneDeep(this.component.modalTitle);

    if (!modalTitle) {
      return null;
    }

    if (modalTitle.includes('{{') && modalTitle.includes('}}')) {
      const value = modalTitle.substring(modalTitle.indexOf('{{') + 2, modalTitle.lastIndexOf('}}'));
      const title = this.t(_.get(this, value));

      modalTitle = modalTitle.replace(`{{${value}}}`, title);
    }

    return this.t(modalTitle);
  }

  onChangeValue = (value, selected = [], flags = {}) => {
    this.onReactValueChanged(value, {
      noUpdateEvent: this._isInlineEditingMode,
      ...flags
    });

    !_.get(this.root, 'options.saveDraft') && this.checkValidity(this.dataValue);
  };

  async getJournalId(journalId) {
    const key = this.getAttributeToEdit();

    let typeRef = _.get(this.root, 'options.typeRef');

    if (!typeRef) {
      typeRef = await this.getRecord().load('_type?id');
    }

    if (!typeRef) {
      return journalId;
    }

    const foundJournalId = await Records.get(typeRef).load(`attributeById.${key}.config.typeRef._as.ref.journalRef?localId`);

    if (!foundJournalId && journalId.match(TEMPLATE_REGEX)) {
      return null;
    }

    return foundJournalId || journalId || null;
  }

  getComponentAttributes = () => {
    const comp = this.component;

    return {
      isCompact: comp.isCompact,
      multiple: comp.multiple,
      placeholder: getTextByLocale(comp.placeholder),
      disabled: comp.disabled,
      linkFormatter: comp.linkFormatter,
      viewOnly: this.viewOnly,
      viewMode: comp.source.viewMode,
      customValues: SelectJournalComponent.getCustomValues(comp),
      displayColumns: comp.displayColumns,
      isSelectedValueAsText: comp.isSelectedValueAsText,
      isFullScreenWidthModal: comp.isFullScreenWidthModal,
      isInlineEditingMode: this._isInlineEditingMode,
      forceReload: comp.forceReload,
      searchField: comp.searchField,
      sortBy: {
        attribute: comp.sortAttribute,
        ascending: comp.sortAscending !== SortOrderOptions.DESC.value
      },
      // Cause https://citeck.atlassian.net/browse/ECOSUI-208
      // If component has calculateValue, disable value reset when apply custom predicate
      disableResetOnApplyCustomPredicate: !!comp.calculateValue,
      title: this.modalTitle,
      dataType: this.component.ecos.dataType,
      journalId: this.journalId
    };
  };

  getInitialReactProps() {
    const resolveProps = (journalId, columns = []) => {
      const component = this.component;
      const isInlineEditDisabled =
        this.options.readOnly && (_.get(this, 'options.disableInlineEdit', false) || component.disableInlineEdit);
      const isModalMode = !!(this.element && this.element.closest('.modal'));
      const presetFilterPredicates = component.presetFilterPredicatesJs
        ? this.evaluate(component.presetFilterPredicatesJs, {}, 'value', true)
        : null;
      // Cause: https://citeck.atlassian.net/browse/ECOSUI-1549
      const queryData = component.queryDataJs ? this.evaluate(component.queryDataJs, {}, 'value', true) : component.queryData || null;

      const reactComponentProps = {
        columns: columns.length ? trimFields(columns) : undefined,
        defaultValue: this.dataValue,
        journalId,
        onChange: this.onChangeValue,
        queryData,
        hideCreateButton: isInlineEditDisabled || component.hideCreateButton,
        hideEditRowButton: isInlineEditDisabled || component.hideEditRowButton,
        hideDeleteRowButton: isInlineEditDisabled || component.hideDeleteRowButton,
        isModalMode,
        presetFilterPredicates,
        computed: {
          valueDisplayName: value => SelectJournalComponent.getValueDisplayName(this.component, value)
        },
        onError: () => undefined,
        ...this.getComponentAttributes()
      };

      if (component.enableCreateButton) {
        reactComponentProps.enableCreateButton = component.enableCreateButton;
      }

      if (component.customActionRefs) {
        reactComponentProps.customActionRefs = component.customActionRefs;
      }

      if (component.customSourceId) {
        reactComponentProps.customSourceId = component.customSourceId;
      }

      if (this.customPredicateValue) {
        reactComponentProps.initCustomPredicate = this.customPredicateValue;
      }

      return reactComponentProps;
    };

    const journalId = this.journalId;
    const fetchPropertiesAndResolve = async journalId => {
      const columns = await this.fetchAsyncProperties(this.component.source);

      journalId = await this.getJournalId(journalId);

      return resolveProps(journalId, columns);
    };

    if (!journalId) {
      const attribute = this.getAttributeToEdit();

      const record = this.getRecord().loadEditorKey(attribute);

      if (!record) {
        return new Promise(() => fetchPropertiesAndResolve(null));
      }

      return record.then(editorKey => fetchPropertiesAndResolve(editorKey)).catch(() => fetchPropertiesAndResolve(null));
    } else {
      return fetchPropertiesAndResolve(journalId);
    }
  }

  redraw(shouldRedrawInBuilder) {
    super.redraw(shouldRedrawInBuilder);
  }

  viewOnlyBuild() {
    super.viewOnlyBuild();
    this.refreshElementHasValueClasses();
  }

  setValue(value, flags) {
    if (_.isEmpty(this.dataValue) && this.dataValue !== value && !_.isEmpty(this.react.resolve)) {
      this.setReactProps({ defaultValue: value });
    }

    return super.setValue(value, flags);
  }

  updateValue(flags, value) {
    const changed = super.updateValue(flags, value);
    const props = _.get(this.react, 'wrapper.props.props', {});

    this.refreshElementHasValueClasses();

    if (changed) {
      props.defaultValue = value;
    }

    this.delayedSettingProps(props);

    return changed;
  }

  delayedSettingProps = _.debounce(
    props => {
      this.setReactProps({
        ...props,
        ...this.getComponentAttributes()
      });
    },
    250,
    { maxWait: 500, trailing: true }
  );

  refreshElementHasValueClasses() {
    if (!this.element) {
      return;
    }

    const component = this.component;
    const { multiple, source } = component;

    if (source.viewMode !== DisplayModes.TABLE) {
      return;
    }

    const viewOnlyHasValueClassName = 'formio-component__view-only-table-has-rows';
    const hasValue = multiple ? Array.isArray(this.dataValue) && this.dataValue.length > 0 : !!this.dataValue;
    const elementHasClass = this.element.classList.contains(viewOnlyHasValueClassName);

    if (!hasValue && elementHasClass) {
      this.element.classList.remove(viewOnlyHasValueClassName);
    } else if (hasValue && !elementHasClass) {
      this.element.classList.add(viewOnlyHasValueClassName);
    }
  }

  static getValueDisplayName = (component, value) => {
    const dispNameJs = _.get(component, 'computed.valueDisplayName', null);
    let result;

    if (dispNameJs) {
      const model = { _ };

      if (_.isString(value)) {
        const recordId = value[0] === '{' ? EcosFormUtils.initJsonRecord(value) : value;
        model.value = Records.get(recordId);
      } else {
        model.value = value;
      }

      result = formioEvaluate(dispNameJs, model, 'disp', true);
    } else {
      result = Records.get(value).load('.disp');
    }

    return result || value;
  };

  static getCustomValues = component => {
    if (component.source.customValues) {
      return formioEvaluate(component.source.customValues, {}, 'values', true);
    }

    return [];
  };

  static optimizeSchema(comp) {
    return _.omit(comp, ['displayColumnsAsyncData']);
  }
}
