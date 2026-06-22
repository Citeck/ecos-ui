import { SourcesId } from '@citeck/constants';
import Records from '@citeck/records-core';
import get from 'lodash/get';

import { getCurrentUserName } from '@/helpers/util';
import WidgetService from '@/services/WidgetService';
import AuthorityService from '@/services/authrority/AuthorityService';
import { PresetsServiceApi } from '@/components/journals/Journals/service';
import { notifySuccess, notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

import { getWorkspaceId } from '@/helpers/urls.js';

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

      let authoritiesRef;
      if (!data.authorities) {
        data.authorities = [data.authority || getCurrentUserName()];
      }
      authoritiesRef = await AuthorityService.getAuthorityRef(data.authorities);
      const workspaces = data.workspaces || [getWorkspaceId()];
      const workspacesRefs = workspaces.map(id => 'emodel/workspace@' + id);

      const onClose = () => modal.destroy();
      const onSave = async newData => {
        const authorities = await AuthorityService.getAuthorityName(newData.authoritiesRef);
        const workspacesRefs = newData.workspacesRefs;
        const preset = await PresetsServiceApi.savePreset({ id: rec.id, ...data, ...newData, authorities, workspacesRefs });

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
        authoritiesRef,
        workspacesRefs,
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
