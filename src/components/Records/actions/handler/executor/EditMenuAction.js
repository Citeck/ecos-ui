import React from 'react';
import MenuSettingsService from '../../../../../services/MenuSettingsService';
import { notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class EditMenuAction extends ActionsExecutor {
  static ACTION_ID = 'edit-menu';

  async execForRecord(record, action, context) {
    try {
      return new Promise(resolve => {
        MenuSettingsService.emitter.emit(MenuSettingsService.Events.SHOW, { recordId: record.id }, resolve);
      });
    } catch (e) {
      notifyFailure();
      return false;
    }
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.edit',
      icon: 'icon-edit'
    };
  }
}
