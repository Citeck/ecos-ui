import get from 'lodash/get';

import EcosFormUtils from '../../../../EcosForm/EcosFormUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class DebugFormAction extends ActionsExecutor {
  static ACTION_ID = 'debug-form';

  async execForRecord(record, action, context) {
    EcosFormUtils.eform(get(action, 'config.recordRef'), {
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
