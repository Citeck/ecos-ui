import ActionsExecutor from '../ActionsExecutor';

export default class EditPasswordAction extends ActionsExecutor {
  static ACTION_ID = 'change-user-password';

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit-password',
      icon: 'icon-edit'
    };
  }
}
