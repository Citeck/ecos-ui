import WidgetService from '../../../../../services/WidgetService';
import ActionsExecutor from '../ActionsExecutor';

export default class EditPasswordAction extends ActionsExecutor {
  static ACTION_ID = 'edit-password';

  async execForRecord(record, action, context) {
    console.log(action);
    return new Promise(resolve => {
      WidgetService.openEditorPassword({ record, onClose: resolve });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit-password',
      icon: 'icon-edit'
    };
  }
}
