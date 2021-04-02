import get from 'lodash/get';

import ActionsExecutor from '../ActionsExecutor';
import WidgetService from '../../../../../services/WidgetService';

export default class PreviewModalAction extends ActionsExecutor {
  static ACTION_ID = 'content-preview-modal';

  async execForRecord(record, action, context) {
    const scale = get(action, 'config.scale');

    WidgetService.openPreviewModal({ recordId: record.id, scale });
    return false;
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.preview',
      icon: 'icon-eye-show'
    };
  }
}
