import lodash from 'lodash';

import { deepClone, extractLabel, t } from '../../../helpers/util';
import { ActionModes } from '../../../constants';
import DialogManager from '../../common/dialogs/Manager/DialogManager';
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
  config: {},
  confirm: null
};

let RecordActions;

class RecordActionsService {
  getActions(records, context = {}) {
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

  __filterAndConvertRecordActions(recordId, actions, context = {}) {
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

        resultAction.name = extractLabel(resultAction.name);
        resultAction.context = Object.assign({}, context);

        return resultAction;
      });
  }

  __getRecordsActionsWithContext(recordIds, context = {}) {
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

  static _getConfirmData = action => {
    const title = extractLabel(lodash.get(action, 'confirm.title'));
    const text = extractLabel(lodash.get(action, 'confirm.message'));
    const formId = lodash.get(action, 'confirm.formRef');
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

  static _setDataByMap = (action, data) => {
    const attributesMapping = lodash.get(action, 'confirm.attributesMapping') || {};

    for (let path in attributesMapping) {
      if (attributesMapping.hasOwnProperty(path)) {
        lodash.set(action, `config.${path}`, lodash.get(data, attributesMapping[path]));
      }
    }
  };

  execAction = async (recordsId, action) => {
    const execute = data => {
      if (!lodash.isEmpty(data)) {
        RecordActionsService._setDataByMap(action, data);
      }

      const records = Records.get(recordsId);
      const executorPromise = (async () => {
        const executor = RecordActionExecutorsRegistry.get(action.type);

        if (lodash.isArray(recordsId)) {
          if (executor.groupExec) {
            return Promise.resolve(executor.groupExec({ records, action }));
          } else {
            return Promise.all(
              recordsId.map(async record => {
                const config = await this.replaceAttributeValues(action.config, record);

                return executor.execute({
                  record: Records.get(record),
                  action: { ...action, config }
                });
              })
            );
          }
        }

        if (executor.execute) {
          const config = await this.replaceAttributeValues(action.config, recordsId);

          return Promise.resolve(
            executor.execute({
              record: records,
              action: { ...action, config }
            })
          );
        } else {
          return Promise.resolve(executor.groupExec({ records, action })).then(result => (lodash.isArray(result) ? result[0] : result));
        }
      })();

      return executorPromise.then(result => {
        lodash.isArray(records) ? records.forEach(record => record.update()) : records.update();
        return result;
      });
    };

    const confirmData = RecordActionsService._getConfirmData(action);

    if (confirmData) {
      return new Promise(resolve => {
        RecordActionsService._confirmExecAction(confirmData, result => (!!result ? resolve(execute(result)) : resolve(false)));
      });
    }

    return execute();
  };

  replaceAttributeValues = async (data = {}, record) => {
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
          mutableData[key] = await this.replaceAttributeValues(mutableData[key], record);
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
  };

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
