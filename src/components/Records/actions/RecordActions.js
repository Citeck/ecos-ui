import RecordActionExecutorsRegistry from './RecordActionExecutorsRegistry';
import Records from '../Records';
import lodash from 'lodash';
import { t } from '../../../helpers/util';

let RecordActions;

class RecordActionsService {
  getActions(records, context) {
    let isSingleRecord = false;
    if (!lodash.isArray(records)) {
      records = [records];
      isSingleRecord = true;
    }

    let result = {};

    for (let rec of records) {
      rec = Records.get(rec);
      let actions = RecordActionsService.__getDefaultActions();

      result[rec.id] = actions.filter(a => {
        let executor = RecordActionExecutorsRegistry.get(a.type);
        return executor && (!executor.canBeExecuted || executor.canBeExecuted(rec, context));
      });
    }

    if (isSingleRecord) {
      return result[Object.keys(result)[0]];
    }

    return result;
  }

  execAction(records, action, context) {
    let executor = RecordActionExecutorsRegistry.get(action.type);
    if (lodash.isArray(records)) {
      return Promise.all(records.map(r => executor.execute(Records.get(r), action, context)));
    }
    return Promise.resolve(executor.execute(Records.get(records), action, context));
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
        type: 'delete',
        icon: 'icon-delete',
        theme: 'danger'
      }
    ];
  }
}

window.Citeck = window.Citeck || {};
RecordActions = window.Citeck.RecordActions || new RecordActionsService();
window.Citeck.RecordActions = RecordActions;

export default RecordActions;
