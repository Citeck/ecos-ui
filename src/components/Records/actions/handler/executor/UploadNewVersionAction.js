import WidgetService from '../../../../../services/WidgetService';
import ActionsExecutor from '../ActionsExecutor';

export default class UploadNewVersionAction extends ActionsExecutor {
  static ACTION_ID = 'upload-new-version';

  async execForRecord(record, action, context) {
    return new Promise(resolve => {
      WidgetService.uploadNewVersion({ record, onClose: resolve });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.upload-new-version',
      icon: 'icon-upload'
    };
  }
}
