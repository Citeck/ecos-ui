import ActionsExecutor from '../ActionsExecutor';
import DocPermissionsService from '../../../../DocPermissions/DocPermissionsService';

export default class EditDocPermissionsAction extends ActionsExecutor {
  static ACTION_ID = 'edit-doc-permissions';

  async execForRecord(record, action, context) {
    DocPermissionsService.openEditor(record);
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit-doc-permissions',
      icon: 'icon-decision-tables'
    };
  }
}
