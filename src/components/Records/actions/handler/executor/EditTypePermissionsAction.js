import ActionsExecutor from '../ActionsExecutor';
import TypePermissionsService from '../../../../TypePermissions/TypePermissionsService';

export default class EditTypePermissionsAction extends ActionsExecutor {
  static ACTION_ID = 'edit-type-permissions';

  async execForRecord(record, action, context) {
    return TypePermissionsService.editTypePermissions(record.id);
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit-type-permissions',
      icon: 'icon-decision-tables'
    };
  }
}
