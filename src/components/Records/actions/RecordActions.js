import lodash from 'lodash';

import { getDisplayText, t } from '../../../helpers/util';
import { ActionModes } from '../../../constants';
import Records from '../Records';
import RecordActionExecutorsRegistry from './RecordActionExecutorsRegistry';
import { DefaultActionTypes } from './DefaultActions';

const DEFAULT_MODEL = {
  name: '',
  type: '',
  variants: [],
  theme: '',
  icon: '',
  order: 0.0,
  config: {}
};

let RecordActions;

class RecordActionsService {
  getActions(records, context) {
    let isSingleRecord = false;

    if (records && !lodash.isArray(records)) {
      records = [records];
      isSingleRecord = true;
    }

    if (!records || !records.length) {
      return Promise.resolve([]);
    }

    const recordsIds = records.map(r => (r.id ? r.id : r));

    return this.__getRecordsActionsWithContext(recordsIds, context)
      .then(actionsByRecord => {
        let result = {};

        for (let recordId of recordsIds) {
          result[recordId] = this.__filterAndConvertRecordActions(recordId, actionsByRecord[recordId], context);
        }

        if (isSingleRecord) {
          return result[Object.keys(result)[0]];
        }

        return result;
      })
      .catch(e => {
        console.error(e);
        let result = {};
        for (let recordId of recordsIds) {
          result[recordId] = [];
        }
        return result;
      });
  }

  __filterAndConvertRecordActions(recordId, actions, context) {
    if (!actions || !actions.length) {
      return [];
    }

    const record = Records.get(recordId);

    return actions
      .filter(action => {
        if (!action.type) {
          console.warn('action without type', action);
          return false;
        }
        let executor = RecordActionExecutorsRegistry.get(action.type);
        if (!executor) {
          console.warn('action without executor', action);
          return false;
        }

        return !executor.canBeExecuted || executor.canBeExecuted({ record, action, context });
      })
      .map(action => {
        const executor = RecordActionExecutorsRegistry.get(action.type);
        const executorDefaultModel = executor.getDefaultModel ? executor.getDefaultModel() || {} : {};
        const resultAction = {};

        for (let field in DEFAULT_MODEL) {
          if (DEFAULT_MODEL.hasOwnProperty(field)) {
            resultAction[field] = action[field] || executorDefaultModel[field] || DEFAULT_MODEL[field];
          }
        }

        resultAction.name = getDisplayText(resultAction.name);
        resultAction.context = Object.assign({}, context);

        return resultAction;
      });
  }

  __getRecordsActionsWithContext(recordIds, context) {
    let actions;

    if (context.actions) {
      if (!context.actions.length) {
        return Promise.resolve({});
      }

      actions = this.__filterAndGetRecordsActionsConfig(recordIds, context.actions);
    } else if (context.mode === ActionModes.DASHBOARD) {
      actions = this.__getRecordsActionsByType(recordIds);
    }

    return actions
      .then(resolvedActions => {
        let actionsByRecord = {};
        for (let recordActions of resolvedActions) {
          if (recordActions.record) {
            actionsByRecord[recordActions.record] = recordActions.actions || [];
          }
        }
        return actionsByRecord;
      })
      .catch(e => {
        console.error(e);
        return {};
      });
  }

  __getRecordsActionsByType(recordsIds) {
    if (!recordsIds || !recordsIds.length) {
      return [];
    }
    let record = Records.get(recordsIds[0]);

    return record.load('_etype?id').then(etype => {
      if (etype) {
        return Records.get(etype)
          .load('_actions[]?str')
          .then(actionsIds => {
            return this.__filterAndGetRecordsActionsConfig([recordsIds[0]], actionsIds);
          });
      } else {
        return record.load('_actions[]?json').then(actions => {
          return [
            {
              record: record.id,
              actions: actions || []
            }
          ];
        });
      }
    });
  }

  __filterAndGetRecordsActionsConfig(recordsIds, actionsIds) {
    if (!recordsIds.length || !actionsIds) {
      return Promise.resolve([]);
    }

    return Records.query(
      {
        sourceId: 'uiserv/action',
        query: {
          records: recordsIds,
          actions: actionsIds
        }
      },
      { record: 'record', actions: 'actions[]?json' }
    )
      .then(resp => resp.records)
      .catch(e => {
        console.error(e);
        return [];
      });
  }

  execAction(records, action) {
    let executor = RecordActionExecutorsRegistry.get(action.type);
    if (lodash.isArray(records)) {
      if (executor.groupExec) {
        return Promise.resolve(
          executor.groupExec({
            records: Records.get(records),
            action
          })
        );
      } else {
        return Promise.all(
          records.map(r =>
            executor.execute({
              record: Records.get(r),
              action
            })
          )
        );
      }
    }
    if (executor.execute) {
      return Promise.resolve(
        executor.execute({
          record: Records.get(records),
          action
        })
      );
    } else {
      return Promise.resolve(
        executor.groupExec({
          records: [Records.get(records)],
          action
        })
      ).then(result => {
        return lodash.isArray(result) ? result[0] : result;
      });
    }
  }

  getActionCreateVariants() {
    let types = [
      DefaultActionTypes.DOWNLOAD,
      DefaultActionTypes.VIEW,
      DefaultActionTypes.EDIT,
      DefaultActionTypes.DELETE,
      'record-actions'
    ];

    return types.map(type => {
      const formKey = 'action_' + type;
      return {
        recordRef: formKey,
        formKey: formKey,
        attributes: {
          type
        },
        label: t('action.' + type + '.label')
      };
    });
  }
}

window.Citeck = window.Citeck || {};
RecordActions = window.Citeck.RecordActions || new RecordActionsService();
window.Citeck.RecordActions = RecordActions;

export default RecordActions;
