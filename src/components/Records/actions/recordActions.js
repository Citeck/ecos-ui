import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';

import { deepClone, extractLabel, t } from '../../../helpers/util';
import DialogManager from '../../common/dialogs/Manager/DialogManager';
import Records from '../Records';

import actionsApi from './recordActionsApi';
import actionsRegistry from './actionsRegistry';

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

export const DEFAULT_MODEL = {
  name: '',
  pluralName: null,
  type: '',
  theme: '',
  icon: '',
  config: {},
  confirm: null,
  result: null,
  features: {}
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

  static async replaceAttributeValues(data, record) {
    if (!data) {
      return {};
    }

    const mutableData = deepClone(data);
    const regExp = /\$\{([^}]+)\}/g;
    const nonSpecialsRegex = /([^${}]+)/g;
    const keys = Object.keys(mutableData);
    const results = new Map();

    if (!keys.length) {
      return mutableData;
    }

    await Promise.all(
      keys.map(async key => {
        if (typeof mutableData[key] === 'object') {
          mutableData[key] = await RecordActions.replaceAttributeValues(mutableData[key], record);
          return;
        }

        if (typeof mutableData[key] !== 'string') {
          return;
        }

        let fields = mutableData[key].match(regExp);

        if (!fields) {
          return;
        }

        fields = fields.map(el => el.match(nonSpecialsRegex)[0]);

        await Promise.all(
          fields.map(async strKey => {
            if (results.has(strKey)) {
              return;
            }

            let recordData = '';

            if (strKey === 'recordRef') {
              recordData = await Records.get(record).id;
            } else {
              recordData = await Records.get(record).load(strKey);
            }

            results.set(strKey, recordData);
          })
        );

        fields.forEach(field => {
          const fieldValue = results.get(field);
          const fieldMask = '${' + field + '}';
          if (mutableData[key] === fieldMask) {
            mutableData[key] = fieldValue;
          } else {
            mutableData[key] = mutableData[key].replace(fieldMask, fieldValue);
          }
        });
      })
    );

    return mutableData;
  }

  static _getConfirmData = action => {
    const title = extractLabel(get(action, 'confirm.title'));
    const text = extractLabel(get(action, 'confirm.message'));
    const formId = get(action, 'confirm.formRef');
    const needConfirm = !!formId || !!title || !!text;

    return needConfirm ? { formId, title, text } : null;
  };

  static _confirmExecAction = (data, callback) => {
    const { title, text, formId } = data;

    if (formId) {
      Records.get(formId)
        .load('definition?json')
        .then(formDefinition => {
          DialogManager.showFormDialog({
            title,
            formDefinition: {
              display: 'form',
              ...formDefinition
            },
            onSubmit: submission => callback(submission.data)
          });
        })
        .catch(e => {
          console.error(e);
          callback(false);
          DialogManager.showInfoDialog({ title: t('error'), text: e.message });
        });
    } else {
      DialogManager.confirmDialog({ title, text, onNo: () => callback(false), onYes: () => callback(true) });
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

  static _fillTargetFromSourceByMap = ({ action, data, targetPath, sourcePath }) => {
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
      return false;
    }
    const handler = RecordActions._getActionsExecutor(action);

    if (handler == null) {
      return false;
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
      RecordActions._fillTargetFromSourceByMap({ action, data: confirmed, sourcePath: 'confirm.', targetPath: 'config.' });
    }

    const config = await RecordActions.replaceAttributeValues(action.config, record);
    const actionToExec = {
      ...action,
      config
    };
    const result = handler.execForRecord(Records.get(record), actionToExec, execContext);

    RecordActions._updateRecords(record);

    return RecordActions._wrapResultIfRequired(result);
  }

  /**
   * @param {Array<String>|Array<Record>} records
   * @param {RecActionWithCtx} action
   * @param {Object} context
   */
  async execForRecords(records, action, context = {}) {
    if (!records || !records.length) {
      return false;
    }

    const handler = RecordActions._getActionsExecutor(action);
    if (handler == null) {
      return false;
    }

    const recordInstances = Records.get(records);

    if (!action.config) {
      action.config = {};
    }

    const confirmed = await RecordActions._checkConfirmAction(action);

    if (!confirmed) {
      return;
    }

    const actionContext = action[ACTION_CONTEXT_KEY] ? action[ACTION_CONTEXT_KEY].context || {} : {};
    const execContext = {
      ...actionContext,
      ...context
    };
    const result = handler.execForRecords(recordInstances, action, execContext);

    RecordActions._updateRecords(recordInstances, true);

    return RecordActions._wrapResultIfRequired(result);
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

    const result = handler.execForQuery(query, action, execContext);
    return RecordActions._wrapResultIfRequired(result);
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
