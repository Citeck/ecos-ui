import chunk from 'lodash/chunk';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import set from 'lodash/set';

import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import { DialogManager } from '../../common/dialogs';
import { EVENTS } from '../../widgets/BaseWidget';
import Records from '../Records';
import { replaceAttributeValues } from '../utils/recordUtils';

import RecordsIterator from './RecordsIterator';
import actionsRegistry from './actionsRegistry';
import ActionsExecutor from './handler/ActionsExecutor';
import ActionsResolver from './handler/ActionsResolver';
import RecordActionsResolver from './handler/RecordActionsResolver';
import actionsApi from './recordActionsApi';
import { DetailActionResult, getActionResultTitle, getRef, notifyFailure, notifySuccess } from './util/actionUtils';
import { ResultTypes } from './util/constants';

import { SourcesId } from '@/constants';
import { getFitnesseInlineToolsClassName } from '@/helpers/tools';
import { beArray, extractLabel, getMLValue, getModule, t } from '@/helpers/util';

const ACTION_CONTEXT_KEY = '__act_ctx__';

const Labels = {
  RECORDS_NOT_ALLOWED_TITLE: 'records-actions.dialog.all-records-not-allowed.title',
  RECORDS_NOT_ALLOWED_TEXT: 'records-actions.dialog.all-records-not-allowed.text',
  CONFIRM_NOT_ALLOWED: 'records-actions.confirm-not-allowed',
  MESSAGE_BACKGROUND_MODE: 'records-actions.background-mode.message'
};

export const DEFAULT_MODEL = {
  name: '',
  pluralName: null,
  type: '',
  theme: '',
  icon: '',
  config: {},
  confirm: null,
  result: null,
  features: {},
  preActionModule: ''
};

class RecordActions {
  static _checkExecActionFeature(feature, handler, allowed) {
    if (allowed === false) {
      return false;
    }

    if (handler instanceof ActionsExecutor) {
      let proto = Object.getPrototypeOf(handler);

      if (proto[feature] === ActionsExecutor.prototype[feature]) {
        if (allowed === true) {
          console.error("Action executor doesn't allow feature " + feature + '. Handler: ', handler);
        }

        return false;
      }

      return true;
    } else if (handler instanceof RecordActionsResolver) {
      return feature === 'execForRecord';
    } else if (handler instanceof ActionsResolver) {
      return true;
    }

    return false;
  }

  /**
   *
   * @param {Array<RecordAction>} actionsDto
   * @param {?Object} context
   *
   * @return {Array<RecActionWithCtx>}
   */
  static _getActionsWithContext(actionsDto, context = {}) {
    if (!actionsDto || !actionsDto.length) {
      return [];
    }
    if (!context) {
      context = {};
    }

    let idx = -1;
    const result = [];

    for (let i = 0; i < actionsDto.length; i++) {
      const action = actionsDto[i] || {};
      const handler = actionsRegistry.getHandler(action.type);
      idx++;

      if (!handler) {
        console.error('Handler is not defined for type ' + action.type + '. Action will be ignored.', action);
        continue;
      }
      if (!handler.isAllowedInContext(context)) {
        continue;
      }

      let features = action.features ? { ...action.features } : {};

      if (handler instanceof ActionsExecutor) {
        features.execForQuery = RecordActions._checkExecActionFeature('execForQuery', handler, features.execForQuery);
        features.execForRecord = RecordActions._checkExecActionFeature('execForRecord', handler, features.execForRecord);
        features.execForRecords = RecordActions._checkExecActionFeature('execForRecords', handler, features.execForRecords);
      } else if (handler instanceof RecordActionsResolver) {
        features = {
          execForQuery: false,
          execForRecord: true,
          execForRecords: false
        };
      } else {
        features = {
          execForQuery: false,
          execForRecord: false,
          execForRecords: false
        };
      }

      const defaultModel = handler.getDefaultActionModel();
      const resAction = Object.assign({}, DEFAULT_MODEL, defaultModel);

      for (let key in action) {
        let value = action[key];
        if (value != null) {
          resAction[key] = value;
        }
      }
      resAction[ACTION_CONTEXT_KEY] = {
        recordMask: 1 << idx,
        context
      };
      resAction.features = features;
      if (!resAction.config) {
        resAction.config = {};
      }
      if (!resAction.pluralName) {
        resAction.pluralName = resAction.name;
      }
      resAction.name = t(resAction.name);
      resAction.pluralName = t(resAction.pluralName);

      RecordActions._expandActionConfig(resAction);

      result.push(resAction);
    }
    return result;
  }

  static _expandActionConfig = action => {
    action.className = getFitnesseInlineToolsClassName(action.id);

    return action;
  };

  /**
   * @param {RecordAction} action
   * @param params
   * @returns {Object}
   * @private
   */
  static _getConfirmData = async (action, params) => {
    const title = extractLabel(get(action, 'confirm.title'));
    const text = extractLabel(get(action, 'confirm.message'));
    const formId = get(action, 'confirm.formRef');
    const modalClass = get(action, 'confirm.modalClass');
    const condition = get(action, 'confirm.condition.fn', false);

    if (isFunction(condition)) {
      // record and records vars for condition function context
      const record = get(params, 'actionRecord');
      // eslint-disable-next-line no-unused-vars
      const records = get(params, 'actionRecords', record ? [record] : []);
      // eslint-disable-next-line no-eval
      const result = await eval(`(function() { ${condition} })();`);

      if (!result) {
        return false;
      }
    }

    if (!formId && !title && !text) {
      return false;
    }

    const formOptions = get(action, 'confirm.formOptions');
    let formData = get(action, 'formData');
    let formAttributes = get(action, 'confirm.formAttributes') || {};

    const actionRecord = params['actionRecord'];
    if (!isEmpty(formAttributes) && actionRecord) {
      formAttributes = await replaceAttributeValues(formAttributes, actionRecord);
    }
    if (isEmpty(formData)) {
      formData = formAttributes;
    } else {
      formData = {
        ...formAttributes,
        ...formData
      };
    }

    return { formId, title, text, modalClass, formData, formOptions };
  };

  static _confirmExecAction = (data, callback) => {
    const { title, text, formId, modalClass, formData, options = {}, formOptions: optionsFromProps = {} } = data;

    if (formId) {
      EcosFormUtils.getFormById(formId, { definition: 'definition?json', i18n: 'i18n?json' })
        .then(formDef => {
          const { definition, ...formOptions } = formDef;
          DialogManager.showFormDialog({
            title,
            formOptions: { ...formOptions, ...options, ...optionsFromProps },
            formDefinition: { display: 'form', ...definition },
            formData,
            onSubmit: submission => callback(submission.data),
            onCancel: _ => callback(false)
          });
        })
        .catch(e => {
          console.error(e);
          callback(false);
          DialogManager.showInfoDialog({ title: t('error'), text: e.message });
        });
    } else {
      DialogManager.confirmDialog({ title, text, modalClass, onNo: () => callback(false), onYes: () => callback(true) });
    }
  };

  static _updateRecords(refs, isInstance = false) {
    const records = isInstance ? refs : Records.get(refs);

    if (Array.isArray(records)) {
      records.forEach(record => record.update());
    } else {
      records.update();
    }
  }

  /**
   * @param {RecordAction} action
   * @param params
   * @returns {Promise<Boolean | unknown>}
   * @private
   */
  static async _checkConfirmAction(action, params) {
    /** @see ConfirmAction */
    const confirmData = await RecordActions._getConfirmData(action, params);

    if (!confirmData) {
      return true;
    }

    get(params, 'actionRecord') && set(confirmData, 'options.actionRecord', params.actionRecord);
    get(params, 'actionRecords') && set(confirmData, 'options.actionRecords', params.actionRecords);

    return await new Promise(resolve => {
      RecordActions._confirmExecAction(confirmData, result => resolve(result));
    });
  }

  /**
   * Run external js module and prepare config / records ...
   *
   * @param {Array<String|Record>|undefined} records
   * @param {RecordAction} action
   * @param context
   * @param {String} nameFunction
   * @returns {Promise<PreProcessActionResult> | PreProcessActionResult}
   * @private
   */
  static async _preProcessAction({ records, action, context }, nameFunction) {
    const result = { preProcessed: false, configMerged: false, hasError: false };

    if (!action.preActionModule) {
      return result;
    }

    const preActionHandler = await getModule(action.preActionModule)
      .then(module => module[nameFunction])
      .catch(e => {
        console.error('Error while pre process module loading', e);
        result.hasError = true;
      });

    if (isFunction(preActionHandler)) {
      try {
        const response = await preActionHandler(records, action, context);
        result.preProcessed = true;

        if (Array.isArray(get(response, 'results'))) {
          result.results = response.results;
          result.preProcessedRecords = result.results.map(res => getRef(res));
        }

        if (!isEmpty(get(response, 'config'))) {
          result.config = { ...action.config, ...response.config };
          result.configMerged = true;
        }
      } catch (e) {
        if (!(e instanceof TypeError)) {
          console.error('Error while pre process module loading', e, preActionHandler);
          result.hasError = true;
        }
      }
    } else {
      console.error(nameFunction, 'This is not function. Check preActionModule', preActionHandler);
    }

    if (result.hasError) {
      notifyFailure();
    }

    return result;
  }

  /**
   * Fill values by attributes mapping (change properties of action)
   *
   * @param {RecordAction} action - configuration
   * @param {Object} data - values which set
   * @param {String} targetPath - where attributesMapping is in action
   * @param {String} sourcePath - where to set values by map
   */
  static _fillDataByMap = ({ action, data, targetPath, sourcePath }) => {
    const attributesMapping = get(action, `${sourcePath}attributesMapping`) || {};

    for (let path in attributesMapping) {
      if (attributesMapping.hasOwnProperty(path)) {
        set(action, `${targetPath}${path}`, get(data, attributesMapping[path]));
      }
    }
  };

  /**
   * Get actions for record.
   *
   * @param {String|Record} record
   * @param {?Array<String>} actions actions identifiers list.
   *                                 If actions == null identifiers will be loaded from record type.
   * @param {?Object} context
   * @return {Promise<Array<RecActionWithCtx>>}
   */
  async getActionsForRecord(record, actions = null, context = {}) {
    if (!record) {
      return [];
    }

    const recordRef = record.id || record;
    if (actions == null) {
      actions = await actionsApi.getActionsForRecord(recordRef);
    }

    const resolvedActions = await this.getActionsForRecords([recordRef], actions, context);

    return get(resolvedActions, ['forRecord', recordRef]) || [];
  }

  async getActionProps(actionIdOrRef) {
    let actionRef = actionIdOrRef;
    if (actionRef.indexOf(SourcesId.ACTION) !== 0) {
      actionRef = SourcesId.ACTION + '@' + actionRef;
    }
    let actionProps = await Records.get(actionRef).load('?json');
    if (actionProps == null) {
      throw new Error('Action is not found: ' + actionIdOrRef);
    }
    return this.getActionInfo(actionProps);
  }

  /**
   * Get actions for records.
   *
   * @param {Array<String>|Array<Record>} records
   * @param {Array<String>} actions
   * @param {?Object} context
   *
   * @return {RecordsActionsRes}
   */
  async getActionsForRecords(records, actions, context = {}) {
    const recordInst = beArray(Records.get(records));
    const recordRefs = recordInst.map(rec => rec.id);
    const resolvedActions = await actionsApi.getActionsForRecords(recordRefs, actions);

    if (!resolvedActions.actions.length) {
      return {
        forRecord: {},
        forRecords: {
          actions: [],
          records: []
        },
        forQuery: {
          actions: []
        }
      };
    }

    const localContext = cloneDeep(context);
    const ctxActions = RecordActions._getActionsWithContext(resolvedActions.actions, localContext);
    const actionsMaskByRecordRef = {};

    for (let i = 0; i < resolvedActions.records.length; i++) {
      actionsMaskByRecordRef[recordRefs[i]] = resolvedActions.records[i];
    }

    const actionsForRecords = {
      forRecords: {
        actions: ctxActions.filter(action => {
          const { records } = resolvedActions;

          if (!get(action, 'features.execForRecords') || isEmpty(records)) {
            return false;
          }

          return records.some(mask => (mask & get(action, [ACTION_CONTEXT_KEY, 'recordMask'])) !== 0);
        }),
        records: actionsMaskByRecordRef
      },
      forQuery: {
        actions: ctxActions.filter(a => a.features.execForQuery === true)
      }
    };

    // resolve actions for record

    const recordsResolvedActions = new Array(ctxActions.length);

    for (let actionIdx = 0; actionIdx < ctxActions.length; actionIdx++) {
      let recordsResolvedActionsForAction = null;
      let action = ctxActions[actionIdx] || {};
      let handler = actionsRegistry.getHandler(action.type);

      if (handler instanceof RecordActionsResolver && action.features.execForRecord === true) {
        recordsResolvedActionsForAction = {};
        let resolvedActions = (await handler.resolve(recordInst, action, localContext)) || {};

        for (let ref in resolvedActions) {
          if (resolvedActions.hasOwnProperty(ref)) {
            const filteredActions = (resolvedActions[ref] || []).filter(a => !!a);

            if (get(resolvedActions, [ref, 'length']) > filteredActions.length) {
              console.warn('After updating a record, not all actions are available. Try to refresh the page', {
                resolvedActions,
                filteredActions
              });
            }

            if (filteredActions.length) {
              recordsResolvedActionsForAction[ref] = (recordsResolvedActionsForAction[ref] || []).concat(filteredActions);
            }
          }
        }
      }
      recordsResolvedActions[actionIdx] = recordsResolvedActionsForAction;
    }

    const possibleActionsForRecord = ctxActions.map(action => ({ action, mask: get(action, [ACTION_CONTEXT_KEY, 'recordMask']) }));
    const forRecord = {};

    for (let ref of recordRefs) {
      let recordMask = actionsMaskByRecordRef[ref];
      let actions = [];

      for (let actionIdx = 0; actionIdx < ctxActions.length; actionIdx++) {
        let possibleAction = possibleActionsForRecord[actionIdx] || {};

        if ((possibleAction.mask & recordMask) === 0 || possibleAction.action.features.execForRecord !== true) {
          continue;
        }

        let resolvedActions = recordsResolvedActions[actionIdx];
        if (resolvedActions == null) {
          actions.push(possibleAction.action);
        } else {
          let refActions = resolvedActions[ref] || [];
          actions = actions.concat(RecordActions._getActionsWithContext(refActions, context));
        }
      }
      forRecord[ref] = actions;
    }
    actionsForRecords.forRecord = forRecord;

    return actionsForRecords;
  }

  /**
   *
   * @param {String|Record} record
   * @param {RecActionWithCtx} action
   * @param {Object} context
   */
  async execForRecord(record, action, context = {}) {
    if (!record) {
      console.error('Record is a mandatory parameter! Action: ', action);
      notifyFailure();
      return false;
    }

    const recordInstance = Records.get(record);
    const handler = RecordActions._getActionsExecutor(action);

    if (handler == null) {
      notifyFailure();
      console.error('No handler. Action: ', action);
      return false;
    }

    /** @type {RecordActionCtxData} */
    const actionContext = get(action, [ACTION_CONTEXT_KEY, 'context']) || {};
    const execContext = {
      ...actionContext,
      ...context
    };

    const confirmed = await RecordActions._checkConfirmAction(action, { actionRecord: recordInstance.id });

    if (!confirmed) {
      return false;
    }

    if (!isEmpty(confirmed)) {
      RecordActions._fillDataByMap({ action, data: confirmed, sourcePath: 'confirm.', targetPath: 'config.' });
    }

    const config = await replaceAttributeValues(action.config, record);
    const actionToExec = {
      ...action,
      config
    };

    const preResult = await RecordActions._preProcessAction({ records: [recordInstance], action: actionToExec, context }, 'execForRecord');

    if (preResult.configMerged) {
      action.config = preResult.config;
    }

    const result = handler.execForRecord(recordInstance, actionToExec, execContext);
    const actResult = await RecordActions._wrapResultIfRequired(result);

    RecordActions._updateRecords(record);

    if (actResult) {
      recordInstance.events.emit(EVENTS.RECORD_ACTION_COMPLETED);
    }

    const noResultModal = get(action, 'config.noResultModal');

    if (!noResultModal) {
      await DetailActionResult.showResult(actResult, { title: getActionResultTitle(action) });
    }

    return actResult;
  }

  _chunkedRecords = [];
  _statusesByRecords = [];
  _messagesByRecords = [];
  _lastExecutionalActionId = '';

  /**
   * @param {Object} actionConfig
   * @param {Object} context
   */
  static async _getFillTemplateConfig(actionConfig, context) {
    const { journalName, journalId } = context || {};
    let { journalColumns = [] } = context || {};

    if (journalColumns.every(col => !col.formatter && col.newFormatter)) {
      journalColumns = journalColumns
        .filter(c => c.default)
        .map(({ attribute, text, newType, newFormatter, multiple }) => ({
          attribute,
          name: text,
          type: newType,
          formatter: newFormatter,
          multiple: multiple
        }));
    }

    const newConfig = await Records.queryOne(
      {
        sourceId: SourcesId.FILL_TEMPLATE_VALUE,
        query: {
          context: {
            journalColumns,
            journalName,
            journalId
          },
          value: actionConfig || {}
        }
      },
      '?json'
    );

    if (!newConfig) {
      return actionConfig;
    }

    return newConfig;
  }

  /**
   * @param {Array<String>|Array<Record>} records
   * @param {RecActionWithCtx} action
   * @param {Object} context
   * @param {{ungearedPopups: ?Boolean}} params
   */
  async execForRecords(records, action = {}, context = {}) {
    const { execForRecordsBatchSize, execForRecordsParallelBatchesCount } = action;
    const isQueryRecords = get(context, 'fromFeature') === 'execForQuery';

    if (this._isEqualRecordsCollection(action)) {
      this._clearRecordsCollection();
    }

    this._lastExecutionalActionId = action.id;

    const ungearedPopups = isQueryRecords;
    const byBatch = execForRecordsBatchSize && execForRecordsBatchSize > 0;

    let withTimeoutError = false;
    let popupExecution = false;

    const getActionAllowedInfoForRecords = this._getActionAllowedInfoForRecords.bind(this);

    const resultOptions = {
      title: getActionResultTitle(action),
      withConfirm: false,
      withoutLoader: byBatch,
      statusesByRecords: isQueryRecords ? this._statusesByRecords : [],
      messagesByRecords: isQueryRecords ? this._messagesByRecords : []
    };

    const chunkedRecords = this._chunkedRecords;

    const execution = await (async function () {
      if (!records || !records.length) {
        return false;
      }

      const handler = RecordActions._getActionsExecutor(action);

      if (handler == null) {
        return false;
      }

      if (!action.config) {
        action.config = {};
      }

      const recordInstances = Records.get(records);
      const confirmed = await RecordActions._checkConfirmAction(action, { actionRecords: records });

      if (!confirmed) {
        return false;
      }

      if (!isEmpty(confirmed)) {
        RecordActions._fillDataByMap({ action, data: confirmed, sourcePath: 'confirm.', targetPath: 'config.' });
      }

      if (!ungearedPopups) {
        popupExecution = await DetailActionResult.showPreviewRecords(
          recordInstances.map(r => getRef(r)),
          resultOptions
        );
      }

      const allowedInfo = await getActionAllowedInfoForRecords(recordInstances, action, context);
      const { allowedRecords = [], notAllowedRecords = [] } = allowedInfo;

      if (!allowedRecords.length) {
        return new Promise(resolve => {
          DialogManager.showInfoDialog({
            title: Labels.RECORDS_NOT_ALLOWED_TITLE,
            text: Labels.RECORDS_NOT_ALLOWED_TEXT,
            onClose: () => resolve(false)
          });
        });
      }

      if (notAllowedRecords.length) {
        const formatData = (rec, status) => ({ recordRef: rec.id, ...rec, status });
        const recordsStatus = [
          ...allowedRecords.map(rec => formatData(rec, 'ALLOWED')),
          ...notAllowedRecords.map(rec => formatData(rec, 'NOT_ALLOWED'))
        ];
        const confirmResult = await DetailActionResult.showResult(recordsStatus, {
          title: t(Labels.CONFIRM_NOT_ALLOWED),
          withConfirm: true
        });

        if (!confirmResult) {
          return false;
        }

        if (!ungearedPopups) {
          const popupRecords = allowedRecords.map(r => getRef(r));

          if (!isEmpty(popupRecords)) {
            popupExecution = await DetailActionResult.showPreviewRecords(popupRecords, resultOptions);
          }
        }
      }

      const actionContext = action[ACTION_CONTEXT_KEY] ? action[ACTION_CONTEXT_KEY].context || {} : {};
      const execContext = { ...actionContext, ...context };

      let preResult;
      let actResult;

      // Cause: https://citeck.atlassian.net/browse/ECOSUI-1562
      if (byBatch) {
        const chunks = chunk(allowedRecords, execForRecordsBatchSize);

        if (isQueryRecords) {
          allowedRecords.forEach(r => chunkedRecords.push(getRef(r)));
        }

        const executeChunks = async chunks => {
          let results = {};

          for (let i = 0; i < chunks.length; i++) {
            const preResult = await RecordActions._preProcessAction({ records: chunks[i], action, context }, 'execForRecords');

            if (preResult.configMerged) {
              action.config = preResult.config;
            }

            if (!isEmpty(preResult.preProcessedRecords) && !isEmpty(chunkedRecords)) {
              await DetailActionResult.showPreviewRecords(chunkedRecords, {
                ...resultOptions,
                withoutLoader: true,
                forRecords: get(preResult, 'results', []).map(item => getRef(item))
              });
            }

            const filteredRecords = preResult.preProcessedRecords
              ? chunks[i].filter(rec => !preResult.preProcessedRecords.includes(rec.id))
              : chunks[i];

            if (!isEmpty(preResult.preProcessedRecords) && isEmpty(filteredRecords)) {
              await DetailActionResult.setStatus(chunkedRecords, {
                ...resultOptions,
                withoutLoader: true,
                forRecords: preResult.preProcessedRecords,
                statuses: preResult.results.reduce(
                  (result, current) => ({
                    ...result,
                    [getRef(current)]: {
                      type: 'ERROR',
                      message: current.message || ''
                    }
                  }),
                  {}
                )
              });

              actResult = {
                ...(actResult || {}),
                type: get(actResult, 'type', ResultTypes.RESULTS),
                data: {
                  results: [...get(actResult, 'data.results', []), ...preResult.results]
                }
              };

              continue;
            }

            const result = await handler.execForRecords(filteredRecords, action, execContext);
            const error = get(result, 'error');

            if (get(result, 'code') === 504) {
              withTimeoutError = true;
            }

            // Cause: https://citeck.atlassian.net/browse/ECOSUI-1578
            if (error) {
              await DetailActionResult.setStatus(chunkedRecords, {
                ...resultOptions,
                withoutLoader: true,
                forRecords: filteredRecords.map(item => getRef(item)),
                statuses: filteredRecords.reduce(
                  (result, current) => ({
                    ...result,
                    [getRef(current)]: {
                      type: 'ERROR',
                      message: error || current.message
                    }
                  }),
                  {}
                )
              });

              delete result.error;

              actResult = {
                ...(actResult || {}),
                ...(result || {}),
                type: get(result, 'type', get(actResult, 'type', ResultTypes.RESULTS)),
                data: {
                  results: [
                    ...get(actResult, 'data.results', []),
                    ...filteredRecords.map(item => ({
                      message: error,
                      status: 'ERROR',
                      nodeRef: getRef(item)
                    }))
                  ]
                }
              };
            } else {
              await DetailActionResult.showPreviewRecords(
                allowedRecords.map(r => getRef(r)),
                {
                  ...resultOptions,
                  withoutLoader: true,
                  forRecords: get(result, 'data.results', []).map(item => getRef(item))
                }
              );

              actResult = {
                ...(actResult || {}),
                ...(result || {}),
                data: {
                  results: [...get(actResult, 'data.results', []), ...get(result, 'data.results', [])]
                }
              };

              if (!isEmpty(chunkedRecords)) {
                await DetailActionResult.setStatus(chunkedRecords, {
                  ...resultOptions,
                  withoutLoader: true,
                  forRecords: get(result, 'data.results', []).map(item => getRef(item)),
                  statuses: get(result, 'data.results', []).reduce(
                    (result, current) => ({
                      ...result,
                      [getRef(current)]: {
                        type: current.status,
                        message: current.message || ''
                      }
                    }),
                    {}
                  )
                });
              }
            }

            results = {
              ...results,
              ...preResult
            };
          }

          return results;
        };

        // Cause: https://citeck.atlassian.net/browse/ECOSUI-1567
        if (execForRecordsParallelBatchesCount && execForRecordsParallelBatchesCount > 1) {
          const parallelChunks = chunk(chunks, execForRecordsParallelBatchesCount);
          const results = await Promise.all(parallelChunks.map(item => executeChunks(item)));

          preResult = results.reduce(
            (result, current) => ({
              ...result,
              ...current
            }),
            {}
          );
        } else {
          preResult = await executeChunks(chunks);
        }
      } else {
        preResult = await RecordActions._preProcessAction({ records: allowedRecords, action, context }, 'execForRecords');

        if (preResult.configMerged) {
          action.config = preResult.config;
        }

        if (context.journalColumns && context.journalName) {
          const newConfig = await RecordActions._getFillTemplateConfig(action.config, context);

          if (!get(newConfig, 'record.id') && get(action.config, 'record.id')) {
            action.config = { ...newConfig, record: { ...get(action.config, 'record', {}), id: action.config.record.id } };
          } else {
            action.config = newConfig;
          }
        }

        const filteredRecords = preResult.preProcessedRecords
          ? allowedRecords.filter(rec => !preResult.preProcessedRecords.includes(rec.id))
          : allowedRecords;
        const result = handler.execForRecords(filteredRecords, action, execContext).catch(error => {
          RecordActions._showTimeoutMessageDialog(error);
        });

        actResult = await RecordActions._wrapResultIfRequired(result);
      }

      if (!isBoolean(actResult) && preResult.preProcessedRecords) {
        if (get(actResult, 'error')) {
          RecordActions._showTimeoutMessageDialog(actResult);
        } else {
          actResult.data.results = [...(actResult.data.results || []), ...(preResult.results || [])];
        }
      }

      RecordActions._updateRecords(allowedRecords, true);

      return actResult;
    })();

    isBoolean(execution)
      ? popupExecution && popupExecution.hide()
      : !ungearedPopups && (await DetailActionResult.showResult(execution, resultOptions));

    if (withTimeoutError) {
      RecordActions._showTimeoutMessageDialog();
    }

    return execution;
  }

  _clearRecordsCollection() {
    this._chunkedRecords = [];
    this._statusesByRecords = [];
    this._messagesByRecords = [];
  }

  static _showTimeoutMessageDialog(data) {
    let message = get(data, 'timeoutErrorMessage');

    message = message ? getMLValue(message) : Labels.MESSAGE_BACKGROUND_MODE;

    DialogManager.showInfoDialog({ text: t(message) });
  }

  async _getActionAllowedInfoForRecords(records, action, context) {
    const allNotAllowedResult = {
      notAllowedRecords: records
    };
    const allAllowedResult = {
      allowedRecords: records
    };

    const executor = RecordActions._getActionsExecutor(action);

    if (!executor || !action.id) {
      return allNotAllowedResult;
    }

    if (!executor.isActionConfigCheckingRequired(action) || get(context, 'fromFeature') === 'execForQuery') {
      return allAllowedResult;
    }

    const actions = await this.getActionsForRecords(records, [action.id], context);
    const actionsMaskByRecord = get(actions, 'forRecords.records');
    const actionFromServer = get(actions, 'forRecords.actions[0]');

    if (!actionsMaskByRecord || !actionFromServer) {
      console.error('Incorrect getActionsForRecords response', actions);
      return allNotAllowedResult;
    }

    const isActionAllowedByRecord = RecordActions.isRecordsGroupActionAllowed(actionsMaskByRecord, actionFromServer);
    const allowedRecords = [];
    const notAllowedRecords = [];

    for (let record of records) {
      if (isActionAllowedByRecord[record.id]) {
        allowedRecords.push(record);
      } else {
        notAllowedRecords.push(record);
      }
    }

    return {
      allowedRecords,
      notAllowedRecords
    };
  }

  /**
   * @param {RecordsQuery} query
   * @param {RecActionWithCtx} action
   * @param {Object} context
   */
  async execForQuery(query, action, context = {}) {
    if (!query) {
      return false;
    }

    const handler = RecordActions._getActionsExecutor(action);

    if (handler == null) {
      return false;
    }

    if (!action.config) {
      action.config = {};
    }

    /** @type {RecordActionCtxData} */
    const actionContext = get(action, [ACTION_CONTEXT_KEY, 'context']) || {};
    const execContext = {
      ...actionContext,
      ...context
    };

    const confirmed = await RecordActions._checkConfirmAction(action);

    if (!confirmed) {
      return;
    }

    let result;

    if (!isEmpty(confirmed)) {
      RecordActions._fillDataByMap({ action, data: confirmed, sourcePath: 'confirm.', targetPath: 'config.' });
    }

    /** @type {PreProcessActionResult} */
    const preResult = await RecordActions._preProcessAction({ action, context }, 'execForQuery');

    if (preResult.configMerged) {
      action.config = preResult.config;
    }

    if (context.journalColumns && context.journalName) {
      action.config = await RecordActions._getFillTemplateConfig(action.config, context);
    }

    if (!!get(action, 'execForQueryConfig.execAsForRecords')) {
      result = await this.execForQueryAsForRecords(query, action, context);
    } else {
      result = handler.execForQuery(query, action, execContext);
    }

    const actResult = await RecordActions._wrapResultIfRequired(result);

    if (!isBoolean(actResult)) {
      await DetailActionResult.showResult(actResult, { title: getActionResultTitle(action) });
    }

    return actResult;
  }

  /**
   * @param {RecordsQuery} query
   * @param {RecActionWithCtx} action
   * @param {Object} context
   */
  async execForQueryAsForRecords(query, action, context) {
    let processedCount = 0;
    let numberIteration = 0;
    let dataTotalCount = 0;
    let showProcess = true;

    const handleInfo = () => {
      notifySuccess('group-action.message.background-mode');
      showProcess = false;
    };

    const info = (title, text, isEnd) => DialogManager.showInfoDialog({ title, text, onClose: () => !isEnd && handleInfo() });

    info('group-action.message.started', 'group-action.label.fetch-data', true);

    if (query.language !== 'predicate') {
      info('error', 'record-action.msg.error.text');
      return false;
    }

    const { page, ...preparedQuery } = query;
    const { confirm, ...preparedAction } = action;
    const preparedContext = { ...context, fromFeature: 'execForQuery' };

    const sortByQuery = preparedQuery.sortBy || [];
    const created = sortByQuery.find(param => param.attribute === '_created');
    if (created) {
      created.ascending = true;
    }

    const sortByQueryCreated = created
      ? [...sortByQuery]
      : [
          ...sortByQuery,
          {
            attribute: '_created',
            ascending: true
          }
        ];

    const queryBody = {
      ...preparedQuery,
      sortBy: sortByQueryCreated
    };

    const iterator = new RecordsIterator(queryBody, {
      amountPerIteration: preparedAction.execForRecordsBatchSize
    });

    const convertData = data => {
      const result = [];

      if (isArray(data)) {
        data.forEach(item => (isObject(item) ? item.id && result.push(item.id) : isString(item) && result.push(item)));
      }

      return result;
    };

    const callback = async data => {
      processedCount += data.records.length;

      if (numberIteration === 0) {
        dataTotalCount = data.totalCount;
      }

      await this.execForRecords(convertData(data.records), preparedAction, preparedContext);

      showProcess &&
        info(
          t('group-action.message.in-progress', { name: action.name }),
          t('group-action.message.processed', { total: dataTotalCount, count: processedCount }),
          dataTotalCount === processedCount
        );

      numberIteration++;
    };

    try {
      await iterator.iterate(callback);
    } finally {
      this._clearRecordsCollection();
    }

    info('success', t('group-action.message.done-name', { action: action.name }), true);

    return true;
  }

  /**
   * Get some information about action (name, icon ...)
   * @param params
   * @return {Object} info
   */
  getActionInfo(params) {
    const defaultDesc = RecordActions._getActionsExecutor(params).getDefaultActionModel();
    return { ...DEFAULT_MODEL, ...defaultDesc, ...params };
  }

  /**
   * Check if group action allowed for records or not
   * @param {Object<String, Number>} records
   * @param {RecActionWithCtx} action
   * @return {Object<String, Boolean>}
   */
  static isRecordsGroupActionAllowed(records, action) {
    const {
      [ACTION_CONTEXT_KEY]: { recordMask }
    } = action;

    const result = {};

    for (let key in records) {
      if (!records.hasOwnProperty(key)) {
        continue;
      }
      result[key] = (records[key] & recordMask) !== 0;
    }
    return result;
  }

  _isEqualRecordsCollection(action) {
    if (this._lastExecutionalActionId !== action.id) {
      return true;
    }

    return false;
  }

  /**
   * Replace null result with 'false' value.
   * @param {Promise<Any>|null} actionResult
   * @return {Promise<Boolean|*>}
   */
  static async _wrapResultIfRequired(actionResult) {
    if (!actionResult) {
      return false;
    }

    if (actionResult.then) {
      return actionResult.then(r => (r == null ? false : r));
    }

    return actionResult;
  }

  /**
   * @param {RecordAction} action
   * @return {ActionsExecutor|null}
   */
  static _getActionsExecutor(action = {}) {
    const handler = actionsRegistry.getHandler(action.type);
    if (handler == null) {
      console.error('Handler is not found for action! Action: ', action);
      return null;
    }
    if (!(handler instanceof ActionsExecutor)) {
      console.error("ActionsHandler is not actions executor. Action can't be executed! Action: ", action);
      return null;
    }
    return handler;
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.RecordActions = window.Citeck.RecordActions || new RecordActions();

export default window.Citeck.RecordActions;
