import Records from '@citeck/records-core';

import WidgetService from '@/services/WidgetService';
import { notifyFailure } from '../../../util/actionUtils';
import ActionsExecutor from '../../ActionsExecutor';

export default class ViewBusinessProcessAction extends ActionsExecutor {
  static ACTION_ID = 'view-business-process';

  async execForRecord(record, action, context) {
    const workflowIdPromise = action.workflowFromRecord ? Records.get(record).load('workflow?id') : Promise.resolve(record);

    const _workflowInfoPromise = recordId =>
      Records.get(recordId)
        .load({ name: '.disp', version: 'version' })
        .then(info => ({ ...info, recordId }));

    const _viewPromise = info =>
      new Promise(resolve => {
        WidgetService.openBusinessProcessModal({ ...info, processId: record.id, onClose: resolve });
      });

    return workflowIdPromise
      .then(_workflowInfoPromise)
      .then(_viewPromise)
      .catch(e => {
        console.error(e);
        notifyFailure();
        return false;
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.view-business-process',
      icon: 'icon-models'
    };
  }
}
