import get from 'lodash/get';

import { FORM_MODE_CREATE } from '../../../../EcosForm';
import ActionsExecutor from '../ActionsExecutor';
import { showForm } from '../../util/actionUtils';

export default class DebugFormAction extends ActionsExecutor {
  static ACTION_ID = 'debug-form';

  async execForRecord(record, action, context) {
    const recordRef = get(action, 'config.recordRef');
    const options = get(action, 'config.options') || {};

    if (!recordRef && !options.formMode) {
      options.formMode = FORM_MODE_CREATE;
    }

    showForm(recordRef, { formId: record.id, options });
  }

  getDefaultActionModel() {
    return {
      name: 'Debug Form'
    };
  }
}
