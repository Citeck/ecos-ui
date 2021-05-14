import get from 'lodash/get';

import ActionsExecutor from '../ActionsExecutor';

export default class DebugFormAction extends ActionsExecutor {
  static ACTION_ID = 'debug-form';

  async execForRecord(record, action, context) {
    window.Citeck.forms.eform(get(action, 'config.recordRef'), {
      params: {
        formId: record.id,
        options: get(action, 'config.options')
      }
    });
  }

  getDefaultActionModel() {
    return {
      name: 'Debug Form'
    };
  }
}
