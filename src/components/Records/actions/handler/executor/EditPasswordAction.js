import { SourcesId } from '../../../../../constants';
import WidgetService from '../../../../../services/WidgetService';
import { UserApi } from '../../../../../api/user';
import { getCurrentUserName } from '../../../../../helpers/util';
import { t } from '../../../../../helpers/export/util';
import { notifyFailure, notifySuccess } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class EditPasswordAction extends ActionsExecutor {
  static ACTION_ID = 'edit-password';

  #userApi = new UserApi();

  async execForRecord(record, action, context) {
    return new Promise(async resolve => {
      const onCancel = flag => {
        modal.terminate();
        resolve(!!flag);
      };

      const onChange = async changes => {
        modal.update({ isLoading: true });
        const result = await this.#userApi.changePassword({ record, data: changes });

        if (result.success) {
          notifySuccess(t('password-editor.success.change-profile-password'));
        } else {
          notifyFailure(`${t('password-editor.error.change-profile-password')}. ${result.message}`);
        }

        onCancel(result.success);
      };

      const modal = WidgetService.openEditorPassword({ onChange, onCancel });
      const authUserData = await this.#userApi.getUserDataByRef(`${SourcesId.PERSON}@${getCurrentUserName()}`);
      const editUserData = await this.#userApi.getUserDataByRef(record.id);

      modal.update({
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
