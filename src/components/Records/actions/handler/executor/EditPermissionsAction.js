import Records from '../../../Records';
import ActionsExecutor from '../ActionsExecutor';

import recordActions from '../../recordActions';

const PERMISSION_SETTINGS_TYPE_ID = 'permission-settings';
const PERMISSION_SETTINGS_TYPE = 'emodel/type@' + PERMISSION_SETTINGS_TYPE_ID;

export default class EditPermissionsAction extends ActionsExecutor {
  static ACTION_ID = 'edit-permissions';

  async execForRecord(record, action, context) {
    const existingSettingsId = await Records.queryOne({
      ecosType: PERMISSION_SETTINGS_TYPE_ID,
      query: { t: 'eq', a: 'recordRef', v: record.id },
      language: 'predicate'
    });

    if (!existingSettingsId) {
      return recordActions.execForRecord(
        record,
        {
          type: 'create',
          config: {
            typeRef: PERMISSION_SETTINGS_TYPE,
            attributes: {
              recordRef: record.id
            }
          }
        },
        context
      );
    } else {
      return recordActions.execForRecord(
        existingSettingsId,
        {
          type: 'edit',
          config: {}
        },
        context
      );
    }
  }

  getDefaultActionModel() {
    return {
      icon: 'icon-decision-tables',
      name: 'Edit permissions'
    };
  }
}
