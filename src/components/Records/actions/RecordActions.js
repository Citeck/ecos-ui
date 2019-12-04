import RecordActionExecutorsRegistry from './RecordActionExecutorsRegistry';
import Records from '../Records';
import lodash from 'lodash';
import { t } from '../../../helpers/util';

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
    if (!lodash.isArray(records)) {
      records = [records];
      isSingleRecord = true;
    }

    return this.__getRecordsActions(records.map(r => (r.id ? r.id : r)), context).then(recordsWithActions => {
      let result = {};

      recordsWithActions.forEach(recordData => {
        let record = Records.get(recordData.record);

        result[recordData.record] = recordData.actions
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
            let executor = RecordActionExecutorsRegistry.get(action.type);
            let executorDefaultModel = executor.getDefaultModel ? executor.getDefaultModel() || {} : {};

            let resultAction = {};

            for (let field in DEFAULT_MODEL) {
              if (DEFAULT_MODEL.hasOwnProperty(field)) {
                resultAction[field] = action[field] || executorDefaultModel[field] || DEFAULT_MODEL[field];
              }
            }

            resultAction.name = t(resultAction.name) || resultAction.name;
            resultAction.context = Object.assign({}, context);

            return resultAction;
          });
      });

      if (isSingleRecord) {
        return result[Object.keys(result)[0]];
      }

      return result;
    });
  }

  __getRecordsActions(records, context) {
    //temp condition to prevent major changes in journal actions
    if (context.mode === 'journal') {
      let actions = RecordActionsService.__getDefaultActions();
      return Promise.resolve(
        records.map(record => {
          return {
            record,
            actions
          };
        })
      );
    }

    return Records.query(
      {
        sourceId: 'uiserv/action',
        query: {
          records: records,
          predicate: context.predicate
        }
      },
      { record: 'record', actions: 'actions[]?json' }
    ).then(resp => resp.records);
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
      return Promise.all(
        executor.groupExec({
          records: [Records.get(records)],
          action
        })
      ).then(result => {
        return result[0];
      });
    }
  }

  static __getDefaultActions() {
    //temp
    return [
      {
        title: t('grid.inline-tools.open-in-background'),
        type: 'open-in-background',
        icon: 'icon-newtab'
      },
      {
        title: t('grid.inline-tools.show'),
        type: 'view',
        icon: 'icon-on'
      },
      {
        title: t('grid.inline-tools.download'),
        type: 'download',
        icon: 'icon-download'
      },
      {
        title: t('grid.inline-tools.edit'),
        type: 'edit',
        icon: 'icon-edit'
      },
      {
        title: t('grid.inline-tools.delete'),
        type: 'delete',
        icon: 'icon-delete',
        theme: 'danger'
      },
      {
        title: t('grid.inline-tools.details'),
        type: 'move-to-lines',
        icon: 'icon-big-arrow'
      }
    ];
  }
}

window.Citeck = window.Citeck || {};
RecordActions = window.Citeck.RecordActions || new RecordActionsService();
window.Citeck.RecordActions = RecordActions;

export default RecordActions;
