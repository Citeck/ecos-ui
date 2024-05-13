import get from 'lodash/get';

import WidgetService from '../../../../../services/WidgetService';
import ActionsExecutor from '../ActionsExecutor';
import { PresetsServiceApi } from '../../../../Journals/service';
import { SourcesId } from '../../../../../constants';
import { getCurrentUserName } from '../../../../../helpers/util';
import Records from '../../../Records';
import { notifySuccess, notifyFailure } from '../../util/actionUtils';
import AuthorityService from '../../../../../services/authrority/AuthorityService';

export default class EditJournalPresetAction extends ActionsExecutor {
  static ACTION_ID = 'edit-journal-preset';

  async execForRecord(record, action, context) {
    return new Promise(async resolve => {
      const data = get(action, 'config.data') || {};
      const rec = Records.get(record);
      const isEditing = rec.id.split('@').length > 1;
      const title = isEditing
        ? 'record-action.edit-journal-preset.modal.title.edit'
        : 'record-action.edit-journal-preset.modal.title.create';

      if (!data.authority) {
        data.authority = getCurrentUserName();
      }
      const authorityRef = await AuthorityService.getAuthorityRef(data.authority);

      let authoritiesRef;
      if (!data.authorities) {
        data.authorities = [data.authority];
        authoritiesRef = [authorityRef];
      } else {
        authoritiesRef = await AuthorityService.getAuthorityRef(data.authorities);
      }

      const onClose = () => modal.destroy();
      const onSave = async newData => {
        const authority = await AuthorityService.getAuthorityName(newData.authorityRef);
        const authorities = await AuthorityService.getAuthorityName(newData.authoritiesRef);
        const preset = await PresetsServiceApi.savePreset({ id: rec.id, ...data, ...newData, authority, authorities });

        if (preset && preset.id) {
          notifySuccess('record-action.edit-journal-preset.msg.saved-success');
        } else {
          notifyFailure('record-action.edit-journal-preset.msg.saved-error');
        }

        resolve(preset);
        onClose();
      };

      let isCurrentUserAdmin = await Records.get(SourcesId.PERSON + '@' + getCurrentUserName()).load('isAdmin?bool!false');

      const modal = WidgetService.openEditorJournalPreset({
        onSave,
        onClose,
        title,
        isAdmin: isCurrentUserAdmin,
        authorityRef,
        authoritiesRef,
        data
      });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.edit-journal-preset.name',
      icon: 'icon-edit'
    };
  }
}
