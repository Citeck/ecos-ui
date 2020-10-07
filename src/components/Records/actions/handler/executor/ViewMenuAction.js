import MenuSettingsService from '../../../../../services/MenuSettingsService';
import { notifyFailure } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class ViewMenuAction extends ActionsExecutor {
  static ACTION_ID = 'view-menu';

  async execForRecord(record, action, context) {
    try {
      MenuSettingsService.emitter.emit(MenuSettingsService.Events.SHOW, { recordId: record.id, disabledEdit: true });
      return true;
    } catch (e) {
      console.error(e);
      notifyFailure();
      return false;
    }
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.show',
      icon: 'icon-small-eye-show'
    };
  }
}
