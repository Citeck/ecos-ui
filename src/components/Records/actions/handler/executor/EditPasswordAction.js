import { SourcesId } from '../../../../../constants';
import WidgetService from '../../../../../services/WidgetService';
import { UserApi } from '../../../../../api/user';
import { getCurrentUserName } from '../../../../../helpers/util';
import ActionsExecutor from '../ActionsExecutor';

export default class EditPasswordAction extends ActionsExecutor {
  static ACTION_ID = 'edit-password';

  #userApi = new UserApi();

  async execForRecord(record, action, context) {
    return new Promise(async resolve => {
      const modal = WidgetService.openEditorPassword();
      const authUserData = await this.#userApi.getUserDataByRef(`${SourcesId.PERSON}@${getCurrentUserName()}`);
      const editUserData = await this.#userApi.getUserDataByRef(record.id);

      modal.open({
        ...editUserData,
        isAdminEditor: authUserData.isAdmin,
        isCurrentUser: authUserData.userName === editUserData.userName,
        isLoading: false
      });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit-password',
      icon: 'icon-edit'
    };
  }
}
