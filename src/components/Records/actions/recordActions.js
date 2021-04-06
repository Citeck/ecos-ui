import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';
import isBoolean from 'lodash/isBoolean';

import { extractLabel, getModule, t } from '../../../helpers/util';
import { replaceAttributeValues } from '../utils/recordUtils';
import Records from '../Records';
import { DialogManager } from '../../common/dialogs';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';

import actionsApi from './recordActionsApi';
import actionsRegistry from './actionsRegistry';
import { DetailActionResult, getActionResultTitle, notifyFailure } from './util/actionUtils';

import ActionsExecutor from './handler/ActionsExecutor';
import ActionsResolver from './handler/ActionsResolver';
import RecordActionsResolver from './handler/RecordActionsResolver';

/**
 * @typedef {Boolean} RecordsActionBoolResult
 * true if action was executed and something changed (update required).
 * false if action is not executed or nothing changed (update not required).
 *
 * @typedef {Object} RecordsActionObjResult
 * @property {String} type
 * @property {Object} config
 *
 * @typedef {RecordsActionBoolResult|RecordsActionObjResult} RecordsActionResult
 *
 * @typedef {Object} RecordActionFeatures
 * @property {Boolean} execForQuery
 * @property {Boolean} execForRecord
 * @property {Boolean} execForRecords

 * @typedef {Object} RecordAction
 * @property {String} id
 * @property {String} type
 * @property {String} icon
 * @property {String} name
 * @property {String} pluralName
 * @property {Object} config
 * @property {RecordActionFeatures} features
 *
 * @typedef RecordActionCtxData
 * @property {Object} context
 * @property {Number} recordsMask
 *
 * @typedef {RecordAction & RecordActionCtxData} RecActionWithCtx
 *
 * @typedef {Object} ForRecordsRes
 * @property {Array<RecActionWithCtx>} actions
 * @property {Object<String,number>} records
 *
 * @typedef {Object} RecordsActionsRes
 * @property {Object<String,Array<RecActionWithCtx>>} forRecord
 * @property {ForRecordsRes} forRecords
 * @property {Object<String>} forQuery
 *
 * @typedef {Object} RecordsQuery
 */

const ACTION_CONTEXT_KEY = '__act_ctx__';

const Labels = {
  RECORDS_NOT_ALLOWED_TITLE: 'records-actions.dialog.all-records-not-allowed.title',
  RECORDS_NOT_ALLOWED_TEXT: 'records-actions.dialog.all-records-not-allowed.text',
  CONFIRM_NOT_ALLOWED: 'records-actions.confirm-not-allowed'
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
  static _checkExecActionFeature(feature, handler, config) {
    if (config === false) {
      return false;
    }
    if (handler instanceof ActionsExecutor) {
      let proto = Object.getPrototypeOf(handler);
      if (proto[feature] === ActionsExecutor.prototype[feature]) {
        if (config === true) {
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
    for (let action of actionsDto) {
      idx++;
      const handler = actionsRegistry.getHandler(action.type);
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

      result.push(resAction);
    }
    return result;
  }

  static _getConfirmData = action => {
    const title = extractLabel(get(action, 'confirm.title'));
    const text = extractLabel(get(action, 'confirm.message'));
    const formId = get(action, 'confirm.formRef');
    const modalClass = get(action, 'confirm.modalClass');
    const needConfirm = !!formId || !!title || !!text;

    return needConfirm ? { formId, title, text, modalClass } : null;
  };

  static _confirmExecAction = (data, callback) => {
    const { title, text, formId, modalClass } = data;

    if (formId) {
      EcosFormUtils.getFormById(formId, { definition: 'definition?json', i18n: 'i18n?json' })
        .then(formData => {
          const { definition, ...formOptions } = formData;

          DialogManager.showFormDialog({
            title,
            formOptions,
            formDefinition: { display: 'form', ...definition },
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

  static async _checkConfirmAction(action) {
    const confirmData = RecordActions._getConfirmData(action);

    if (!confirmData) {
      return true;
    }

    return await new Promise(resolve => {
      RecordActions._confirmExecAction(confirmData, result => resolve(result));
    });
  }

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

    if (typeof preActionHandler === 'function') {
      try {
        const response = await preActionHandler(records, action, context);
        result.preProcessed = true;

        if (Array.isArray(get(response, 'results'))) {
          result.results = response.results;
          result.preProcessedRecords = result.results.map(res => res.recordRef);
        }

        if (!isEmpty(get(response, 'config'))) {
          result.config = { ...action.config, ...response.config };
          result.configMerged = true;
        }
      } catch (e) {
        console.error('Error while pre process module loading', e, preActionHandler);
        result.hasError = true;
      }
    } else {
      console.error(nameFunction, 'This is not function. Check preActionModule', preActionHandler);
      result.hasError = true;
    }

    if (result.hasError) {
      notifyFailure();
    }

    return result;
  }

  /**
   * Fill values by attributes mapping (change properties of action)
   *
   * @param {Object} action - configuration
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

    return resolvedActions.forRecord[recordRef] || [];
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
    const recordInst = Records.get(records);
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
        actions: ctxActions.filter(a => a.features.execForRecords === true),
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
      let action = ctxActions[actionIdx];
      let handler = actionsRegistry.getHandler(action.type);
      if (handler instanceof RecordActionsResolver && action.features.execForRecord === true) {
        recordsResolvedActionsForAction = {};
        let resolvedActions = await handler.resolve(recordInst, action, localContext);
        for (let ref in resolvedActions) {
          if (resolvedActions.hasOwnProperty(ref)) {
            recordsResolvedActionsForAction[ref] = (recordsResolvedActionsForAction[ref] || []).concat(resolvedActions[ref]);
          }
        }
      }
      recordsResolvedActions[actionIdx] = recordsResolvedActionsForAction;
    }

    const possibleActionsForRecord = ctxActions.map(a => {
      return {
        action: a,
        mask: (a[ACTION_CONTEXT_KEY] || {}).recordMask
      };
    });

    const forRecord = {};
    for (let ref of recordRefs) {
      let recordMask = actionsMaskByRecordRef[ref];
      let actions = [];

      for (let actionIdx = 0; actionIdx < ctxActions.length; actionIdx++) {
        let possibleAction = possibleActionsForRecord[actionIdx];
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

    const handler = RecordActions._getActionsExecutor(action);

    if (handler == null) {
      notifyFailure();
      console.error('No handler. Action: ', action);
      return false;
    }

    const actionContext = action[ACTION_CONTEXT_KEY] ? action[ACTION_CONTEXT_KEY].context || {} : {};
    const execContext = {
      ...actionContext,
      ...context
    };

    const confirmed = await RecordActions._checkConfirmAction(action);

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

    const preResult = await RecordActions._preProcessAction(
      { records: [Records.get(record)], action: actionToExec, context },
      'execForRecord'
    );

    if (preResult.configMerged) {
      action.config = preResult.config;
    }

    const result = handler.execForRecord(Records.get(record), actionToExec, execContext);
    const actResult = await RecordActions._wrapResultIfRequired(result);

    RecordActions._updateRecords(record);

    const noResultModal = get(action, 'config.noResultModal');

    if (!isBoolean(actResult) && !noResultModal) {
      await DetailActionResult.showResult(actResult, { title: getActionResultTitle(action) });
    }

    return actResult;
  }

  /**
   * @param {Array<String>|Array<Record>} records
   * @param {RecActionWithCtx} action
   * @param {Object} context
   */
  async execForRecords(records, action, context = {}) {
    let popupExecution;
    const getActionAllowedInfoForRecords = this._getActionAllowedInfoForRecords.bind(this);
    const resultOptions = { title: getActionResultTitle(action), withConfirm: false };

    const execution = await (async function() {
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
      const confirmed = await RecordActions._checkConfirmAction(action);

      if (!confirmed) {
        return false;
      }

      if (!isEmpty(confirmed)) {
        RecordActions._fillDataByMap({ action, data: confirmed, sourcePath: 'confirm.', targetPath: 'config.' });
      }

      popupExecution = await DetailActionResult.showPreviewRecords(recordInstances.map(r => r.id), resultOptions);

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

        popupExecution = await DetailActionResult.showPreviewRecords(allowedRecords.map(r => r.id), resultOptions);
      }

      const actionContext = action[ACTION_CONTEXT_KEY] ? action[ACTION_CONTEXT_KEY].context || {} : {};
      const execContext = { ...actionContext, ...context };
      const preResult = await RecordActions._preProcessAction({ records: allowedRecords, action, context }, 'execForRecords');

      if (preResult.configMerged) {
        action.config = preResult.config;
      }

      const filteredRecords = preResult.preProcessedRecords
        ? allowedRecords.filter(rec => !preResult.preProcessedRecords.includes(rec.id))
        : allowedRecords;

      const result = handler.execForRecords(filteredRecords, action, execContext);
      const actResult = await RecordActions._wrapResultIfRequired(result);

      if (!isBoolean(actResult) && preResult.preProcessedRecords) {
        actResult.data.results = [...(actResult.data.results || []), ...(preResult.results || [])];
      }

      RecordActions._updateRecords(allowedRecords, true);

      return actResult;
    })();

    isBoolean(execution) ? popupExecution && popupExecution.hide() : await DetailActionResult.showResult(execution, resultOptions);

    return execution;
  }

  async _getActionAllowedInfoForRecords(records, action, context) {
    const allNotAllowedResult = {
      notAllowedRecords: records
    };
    const allAllowedResult = {
      allowedRecords: records
    };

    const executor = RecordActions._getActionsExecutor(action);
    if (!executor) {
      return allNotAllowedResult;
    }
    if (!executor.isActionConfigCheckingRequired(action)) {
      return allAllowedResult;
    }

    if (!action.id) {
      return allNotAllowedResult;
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
    const actionContext = action[ACTION_CONTEXT_KEY] ? action[ACTION_CONTEXT_KEY].context || {} : {};
    const execContext = {
      ...actionContext,
      ...context
    };

    const confirmed = await RecordActions._checkConfirmAction(action);

    if (!confirmed) {
      return;
    }

    if (!isEmpty(confirmed)) {
      RecordActions._fillDataByMap({ action, data: confirmed, sourcePath: 'confirm.', targetPath: 'config.' });
    }

    const result = handler.execForQuery(query, action, execContext);
    const actResult = await RecordActions._wrapResultIfRequired(result);

    if (!isBoolean(actResult)) {
      await DetailActionResult.showResult(actResult, { title: getActionResultTitle(action) });
    }

    return actResult;
  }

  /**
   * Get some information about action (name, icon ...)
   * @param params
   * @return {Object} info
   */
  getActionInfo(params) {
    const defaultDesc = RecordActions._getActionsExecutor(params).getDefaultActionModel();
    return { ...defaultDesc, ...params };
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
  static _getActionsExecutor(action) {
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
