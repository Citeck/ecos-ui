import _ from 'lodash';
import { evaluate as formioEvaluate } from 'formiojs/utils/utils';

import { Attributes } from '../../../../constants';
import { trimFields } from '../../../../helpers/util';
import Records from '../../../../components/Records';
import { SelectJournal } from '../../../../components/common/form';
import GqlDataSource from '../../../../components/common/grid/dataSource/GqlDataSource';
import EcosFormUtils from '../../../../components/EcosForm/EcosFormUtils';
import BaseReactComponent from '../base/BaseReactComponent';
import { DisplayModes, SortOrderOptions, TableTypes } from './constants';

export default class SelectJournalComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'SelectJournal',
        key: 'selectJournal',
        type: 'selectJournal',
        customPredicateJs: '',
        queryData: null,
        presetFilterPredicatesJs: '',
        hideCreateButton: false,
        hideEditRowButton: false,
        hideDeleteRowButton: false,
        isFullScreenWidthModal: false,
        isSelectedValueAsText: false,
        isTableMode: false,
        sortAttribute: Attributes.DBID,
        sortAscending: SortOrderOptions.ASC.value,
        source: {
          custom: {
            columns: []
          },
          type: TableTypes.JOURNAL,
          viewMode: DisplayModes.DEFAULT
        },
        displayColumns: [],
        computed: {
          valueDisplayName: ''
        },
        searchField: '',
        ecos: {
          dataType: 'assoc'
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

  checkConditions(data) {
    const result = super.checkConditions(data);

    if (!this.component.customPredicateJs) {
      return result;
    }

    const customPredicate = this.evaluate(this.component.customPredicateJs, {}, 'value', true);

    if (!_.isEqual(customPredicate, this.customPredicateValue)) {
      this.customPredicateValue = customPredicate;
      this.updateReactComponent(component => component.setCustomPredicate(customPredicate));
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

      if (source.type === 'custom') {
        const component = this.component;
        const record = this.getRecord();
        const attribute = this.getAttributeToEdit();
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

              resolve(GqlDataSource.getColumnsStatic(columns));
            })
            .catch(err => {
              console.error(err);
              columnsInfoPromise.then(columns => resolve(GqlDataSource.getColumnsStatic(columns)));
            });
        } catch (e) {
          console.warn(`[SelectJournal fetchAsyncProperties] Can't fetch create variants: ${e.message}`);
          return resolve([]);
        }
      } else {
        resolve([]);
      }
    });
  };

  getInitialReactProps() {
    const resolveProps = (journalId, columns = []) => {
      const component = this.component;
      const isModalMode = !!(this.element && this.element.closest('.modal'));
      const presetFilterPredicates = component.presetFilterPredicatesJs
        ? this.evaluate(component.presetFilterPredicatesJs, {}, 'value', true)
        : null;
      const queryData = component.queryData ? this.evaluate(component.queryData, {}, 'value', true) : null;
      const reactComponentProps = {
        columns: columns.length ? trimFields(columns) : undefined,
        defaultValue: this.dataValue,
        isCompact: component.isCompact,
        multiple: component.multiple,
        placeholder: component.placeholder,
        disabled: component.disabled,
        journalId: journalId,
        onChange: this.onReactValueChanged,
        viewOnly: this.viewOnly,
        queryData,
        viewMode: component.source.viewMode,
        displayColumns: component.displayColumns,
        hideCreateButton: component.hideCreateButton,
        hideEditRowButton: component.hideEditRowButton,
        hideDeleteRowButton: component.hideDeleteRowButton,
        isSelectedValueAsText: component.isSelectedValueAsText,
        isFullScreenWidthModal: component.isFullScreenWidthModal,
        isInlineEditingMode: this._isInlineEditingMode,
        isModalMode,
        presetFilterPredicates,
        searchField: component.searchField,
        sortBy: {
          attribute: component.sortAttribute,
          ascending: component.sortAscending !== SortOrderOptions.DESC.value
        },
        computed: {
          valueDisplayName: value => SelectJournalComponent.getValueDisplayName(this.component, value)
        },
        onError: () => undefined,
        // Cause https://citeck.atlassian.net/browse/ECOSUI-208
        // If component has calculateValue, disable value reset when apply custom predicate
        disableResetOnApplyCustomPredicate: !!component.calculateValue
      };

      if (component.customSourceId) {
        reactComponentProps.customSourceId = component.customSourceId;
      }

      if (this.customPredicateValue) {
        reactComponentProps.initCustomPredicate = this.customPredicateValue;
      }

      return reactComponentProps;
    };

    const journalId = this.component.journalId;
    const fetchPropertiesAndResolve = journalId =>
      this.fetchAsyncProperties(this.component.source).then(columns => resolveProps(journalId, columns));

    if (!journalId) {
      const attribute = this.getAttributeToEdit();

      return this.getRecord()
        .loadEditorKey(attribute)
        .then(editorKey => fetchPropertiesAndResolve(editorKey))
        .catch(() => fetchPropertiesAndResolve(null));
    } else {
      return fetchPropertiesAndResolve(journalId);
    }
  }

  redraw(shouldRedrawInBuilder) {
    super.redraw(shouldRedrawInBuilder);

    this.updateLabel();
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-1401
  updateLabel() {
    if (this.viewOnly) {
      return;
    }

    const isLabelHidden = this.labelIsHidden();
    let className = 'control-label';
    let style = '';

    if (!isLabelHidden) {
      const { labelPosition } = this.component;

      if (labelPosition === 'bottom') {
        className += ' control-label--bottom';
      } else if (labelPosition && labelPosition !== 'top') {
        const labelWidth = this.getLabelWidth();
        const labelMargin = this.getLabelMargin();

        // Label is on the left or right.
        if (this.labelOnTheLeft(labelPosition)) {
          style += `float: left; width: ${labelWidth}%; margin-right: ${labelMargin}%; `;
        } else if (this.labelOnTheRight(labelPosition)) {
          style += `float: right; width: ${labelWidth}%; margin-left: ${labelMargin}%; `;
        }

        if (this.rightAlignedLabel(labelPosition)) {
          style += 'text-align: right; ';
        }
      }
    } else {
      this.addClass(this.element, 'formio-component-label-hidden');
      className += ' control-label--hidden';
    }

    if (this.hasInput && this.component.validate && this.component.validate.required) {
      className += ' field-required';
    }

    const labelElement = this.ce('label', {
      class: className,
      style
    });

    if (!isLabelHidden) {
      if (this.info.attr.id) {
        labelElement.setAttribute('for', this.info.attr.id);
      }

      labelElement.appendChild(this.text(this.component.label));
      this.createTooltip(labelElement);
    }

    this.element.replaceChild(labelElement, this.element.firstChild);
  }

  viewOnlyBuild() {
    super.viewOnlyBuild();
    this.refreshElementHasValueClasses();
  }

  setValue(value, flags) {
    if (_.isEmpty(this.dataValue) && this.dataValue !== value && !_.isEmpty(this.reactComponent.resolve)) {
      this.setReactProps({ defaultValue: value });
    }

    return super.setValue(value, flags);
  }

  updateValue(flags, value) {
    const changed = super.updateValue(flags, value);

    this.refreshElementHasValueClasses();

    if (changed) {
      _.set(this.reactComponent, 'waitingProps.defaultValue', value);
    }

    this.setReactProps(_.get(this.reactComponent, 'wrapper.props.props', {}));

    return changed;
  }

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

    return result ? result : value;
  };

  static optimizeSchema(comp) {
    return _.omit(comp, ['displayColumnsAsyncData']);
  }
}
