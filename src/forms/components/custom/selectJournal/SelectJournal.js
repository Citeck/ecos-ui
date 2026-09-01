import Records from '@citeck/records-core';
import { evaluate as formioEvaluate } from 'formiojs/utils/utils';
import _ from 'lodash';

import BaseReactComponent from '../base/BaseReactComponent';

import { DataTypes, DisplayModes, SearchInWorkspacePolicy, SortOrderOptions, TableTypes, TEMPLATE_REGEX } from './constants';

import EcosFormUtils from '@/components/forms/EcosForm/EcosFormUtils';
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
        customJournalId: '',
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
        searchInWorkspacePolicy: SearchInWorkspacePolicy.CURRENT,
        searchInAdditionalWorkspaces: [],
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

  // The expression the compiled function below belongs to, and the parameter list it was compiled
  // for (the names of the evaluation context, which the form's options may add to).
  customJournalIdSource = null;
  customJournalIdParams = '';
  customJournalIdFn = null;
  // The last run error already traced for the current source — see the catch below.
  customJournalIdLoggedError = null;
  // Set once the expression has produced a journal id — see `checkConditions`.
  isCustomJournalIdResolved = false;

  /**
   * Result of the `customJournalId` expression: '' when there is none, when it does not compile, or
   * when running it throws.
   *
   * Deliberately does not go through `FormioUtils.evaluate` (`this.evaluate`), which is what the
   * rest of the component uses for user scripts. That helper reports both a failed compile *and* a
   * failed run to the console ("An error occured within custom function for ..."), and this
   * expression is read several times per keystroke while it is being typed in the component editor:
   * a half-written script such as `value = va` compiles fine and throws a ReferenceError on every
   * read, which no pre-check on the source can prevent. The compile is done here instead, and kept
   * per source string, so typing costs one compile per edit rather than one per read.
   *
   * A run that throws is *not* remembered: an expression reading data that is not filled in yet
   * throws today and works as soon as it is, so it must be tried again on the next read. A source
   * that does not compile is remembered, because only an edit can change that verdict.
   *
   * @returns {string}
   */
  evaluateCustomJournalId() {
    const source = this.component.customJournalId;

    if (!source) {
      return '';
    }

    // The names and values `FormioUtils.evaluate` would have exposed to the script, prepared the
    // same way it prepares them, so the scripts users have already written behave identically.
    const args = this.evalContext({});

    args.component = args.component ? _.cloneDeep(args.component) : { key: 'unknown' };

    if (!args.form && args.instance) {
      args.form = _.get(args.instance, 'root._form', {});
    }

    if (source.includes('form')) {
      // Deep cloning the form is expensive — only worth it when the script looks like it reads it
      args.form = _.cloneDeep(args.form);
    } else {
      delete args.form;
    }

    const params = Object.keys(args);
    const paramsKey = params.join(',');

    if (source !== this.customJournalIdSource || paramsKey !== this.customJournalIdParams) {
      this.customJournalIdSource = source;
      this.customJournalIdParams = paramsKey;
      this.customJournalIdFn = null;
      this.customJournalIdLoggedError = null;

      try {
        // eslint-disable-next-line no-new-func -- the construction `FormioUtils.evaluate` uses
        this.customJournalIdFn = new Function(...params, `${source};return value`);
      } catch (e) {
        // Does not compile — stays disabled until the source is edited
      }
    }

    if (!this.customJournalIdFn) {
      return '';
    }

    try {
      return this.customJournalIdFn(...Object.values(args)) || '';
    } catch (e) {
      // Half-typed scripts and data that has not arrived yet both land here. The static journalId
      // takes over (see the `journalId` getter) and the next read tries the expression again. An
      // expression broken for good still leaves a trace for whoever debugs the form — one line per
      // distinct error, on the verbose level the editor's keystroke noise never surfaces at.
      if (this.customJournalIdLoggedError !== String(e)) {
        this.customJournalIdLoggedError = String(e);
        console.debug('[SelectJournal] customJournalId failed, the static journalId takes over', e);
      }

      return '';
    }
  }

  // The static journalId as configured on the component, with `${...}` placeholders filled in from
  // the form data. Used on its own wherever the expression's result is already at hand, so that the
  // expression is not evaluated a second time just to reach the fallback.
  get staticJournalId() {
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

  get journalId() {
    // A custom journal expression wins whenever it resolves to something. An empty result — no
    // expression, a script returning '' / null, or data it depends on that is not filled in yet —
    // falls back to the static journalId, so the field keeps working as it did before the
    // expression was added instead of reporting a missing journal.
    return this.evaluateCustomJournalId() || this.staticJournalId;
  }

  checkConditions(data) {
    const result = super.checkConditions(data);

    // On create forms the workspace follows the project the user picks, so it can change while the form is open
    const workspaceId = this.getRecordWorkspaceId();

    if (workspaceId !== (this.workspaceIdValue || '')) {
      this.workspaceIdValue = workspaceId;
      this.setReactProps({ workspaceId });
    }

    if (this.component.customJournalId) {
      // One evaluation per pass: what reaches the React child is the expression's result, or the
      // static journalId once the expression comes back empty — the same rule the getter applies.
      const evaluated = this.evaluateCustomJournalId();
      const journalId = evaluated || this.staticJournalId;
      // Recorded outside the guard below: an expression whose first result happens to equal the id
      // already in play pushes nothing, and would otherwise leave the next — genuinely user-driven —
      // switch looking like the first resolution.
      const isFirstResolveOfExpression = !this.isCustomJournalIdResolved && !!evaluated;

      if (isFirstResolveOfExpression) {
        this.isCustomJournalIdResolved = true;
      }

      if (journalId !== this.customJournalIdValue) {
        // The form is built before its data is loaded — `EcosForm` calls `form.setValue` only after
        // `Formio.createForm` resolves — so an expression that reads the record's own data returns
        // nothing at build time and the child mounts on the static journalId. The expression's very
        // first result therefore reaches the child as a journal *change*, which it answers by
        // clearing the selected record: right when the user switches the journal under a value
        // picked from the previous one, wrong here, where the value is the one the record was opened
        // with. Only that first resolution is exempt; every later switch clears the value as before.
        // Accepted trade-off: on a create form, a value the user picked from the fallback journal
        // before the expression ever resolved survives that first switch stale. Telling the two
        // apart needs a "picked by the user" signal the child does not give — a non-user path
        // reports values back through `onChangeValue` as well — so the data-loss case wins.
        this.customJournalIdValue = journalId;

        this.delayedSettingProps.cancel();
        this.setReactProps({ journalId, keepValueOnJournalIdChange: isFirstResolveOfExpression });
      }
    }

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
      workspaceId: this.getRecordWorkspaceId(),
      viewMode: comp.source.viewMode,
      searchInWorkspacePolicy: comp.searchInWorkspacePolicy,
      searchInAdditionalWorkspaces: comp.searchInAdditionalWorkspaces,
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
      journalId: this.journalId,
      // Every push carries the flag, so the one `checkConditions` sets for the expression's first
      // result cannot linger in the child's props and swallow a later, genuine journal switch.
      keepValueOnJournalIdChange: false
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

      this.workspaceIdValue = reactComponentProps.workspaceId;

      return reactComponentProps;
    };

    // One evaluation for both the id and the decision below.
    const evaluated = this.evaluateCustomJournalId();
    const journalId = evaluated || this.staticJournalId;
    // An expression that resolved to an id owns the journal completely, so the type-level lookup —
    // a record query for the journal declared on the attribute's type — is pointless work here.
    // When it resolves to nothing the static journalId is in play, which is the case that lookup
    // has always handled. (Note that `resolveProps` spreads `getComponentAttributes()` last, so the
    // id `getJournalId` returns is overwritten by the `journalId` getter either way — skipping it
    // saves the request, it does not change which journal wins.)
    const skipTypeRefFallback = !!evaluated;
    const fetchPropertiesAndResolve = async journalId => {
      const columns = await this.fetchAsyncProperties(this.component.source);

      if (!skipTypeRefFallback) {
        journalId = await this.getJournalId(journalId);
      }

      return resolveProps(journalId, columns);
    };

    if (!journalId && !skipTypeRefFallback) {
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
    this.delayedSettingProps.cancel();
    super.redraw(shouldRedrawInBuilder);
  }

  switchToViewOnlyMode() {
    if (this.options.readOnly && !this._isInlineEditingMode) {
      return;
    }

    super.switchToViewOnlyMode();
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

    const viewOnlyTableClassName = 'formio-component__view-only-table';
    if (!this.element.classList.contains(viewOnlyTableClassName)) {
      this.element.classList.add(viewOnlyTableClassName);
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
