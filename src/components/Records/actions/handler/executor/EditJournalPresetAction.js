import get from 'lodash/get';

import WidgetService from '../../../../../services/WidgetService';
import ActionsExecutor from '../ActionsExecutor';
import { PresetsServiceApi } from '../../../../Journals/service';
import { SourcesId } from '../../../../../constants';
import { getCurrentUserName } from '../../../../../helpers/util';
import { UserApi } from '../../../../../api/user';
import Records from '../../../Records';
import { notifySuccess, notifyFailure } from '../../util/actionUtils';

export default class EditJournalPresetAction extends ActionsExecutor {
  static ACTION_ID = 'edit-journal-preset';

  #userApi = new UserApi();

  async execForRecord(record, action, context) {
    return new Promise(async resolve => {
      const authUserData = await this.#userApi.getUserDataByRef(`${SourcesId.PEOPLE}@${getCurrentUserName()}`);
      const data = get(action, 'config.data') || {};
      const id = get(action, 'config.id');

      if (!data.authority) {
        data.authority = authUserData.userName;
      }

      const authorityRef = await Records.get(`${SourcesId.A_AUTHORITY}@${data.authority}`).load('nodeRef');

      const onClose = () => modal.destroy();

      const onSave = async newData => {
        const authority = await Records.get(newData.authorityRef).load('cm:authorityName!cm:userName');
        const preset = await PresetsServiceApi.savePreset({ id, ...data, ...newData, authority });

        if (preset && preset.id) {
          notifySuccess('record-action.edit-journal-preset.msg.saved-success');
        } else {
          notifyFailure('record-action.edit-journal-preset.msg.saved-error');
        }

        resolve(preset);
        onClose();
      };

      const modal = WidgetService.openEditorJournalPreset({ onSave, onClose, isAdmin: authUserData.isAdmin, authorityRef, data });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.edit-journal-preset.name',
      icon: 'icon-edit'
    };
  }
}
