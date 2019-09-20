import RecordActionExecutorsRegistry from './RecordActionExecutorsRegistry';
import Records from '../Records';
import lodash from 'lodash';
import { t } from '../../../helpers/util';

let RecordActions;
let cache = {};

class RecordActionsService {
  getActions(records, context) {
    let isSingleRecord = false;
    if (!lodash.isArray(records)) {
      records = [records];
      isSingleRecord = true;
    }

    let result = {};

    for (let record of records) {
      record = Records.get(record);

      let actions = RecordActionsService.__getDefaultActions();

      let cacheKey = `${context.mode || ''}__${context.scope || ''}__${record.id}`;
      let recActions = cache[cacheKey];
      if (!recActions) {
        recActions = actions.filter(action => {
          let executor = RecordActionExecutorsRegistry.get(action.type);
          return executor && (!executor.canBeExecuted || executor.canBeExecuted({ record, action, context }));
        });
        cache[cacheKey] = recActions;
      }

      result[record.id] = recActions;
    }

    if (Object.keys(cache).length > 200) {
      cache = {};
    }

    if (isSingleRecord) {
      return Promise.resolve(result[Object.keys(result)[0]]);
    }

    return Promise.resolve(result);
  }

  execAction(records, action, context) {
    let executor = RecordActionExecutorsRegistry.get(action.type);
    if (lodash.isArray(records)) {
      if (executor.groupExec) {
        return Promise.resolve(
          executor.groupExec({
            records: Records.get(records),
            action,
            context
          })
        );
      } else {
        return Promise.all(
          records.map(r =>
            executor.execute({
              record: Records.get(r),
              action,
              context
            })
          )
        );
      }
    }
    if (executor.execute) {
      return Promise.resolve(
        executor.execute({
          record: Records.get(records),
          action,
          context
        })
      );
    } else {
      return Promise.all(
        executor.groupExec({
          records: [Records.get(records)],
          action,
          context
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
        type: 'remove',
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
