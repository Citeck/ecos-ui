import get from 'lodash/get';

import ActionsExecutor from '../ActionsExecutor';
import EcosFormUtils from '../../../../EcosForm/EcosFormUtils';
import Records from '../../../Records';

export default class DebugFormAction extends ActionsExecutor {
  static ACTION_ID = 'edit-json';

  async execForRecord(record, action, context) {
    return new Promise(resolve => {
      EcosFormUtils.editRecord({
        recordRef: record.id,
        formKey: 'form-json-editor',
        onSubmit: (rec, form) => {
          const record = Records.get(record.id);
          //todo how save ???
          record.att('.json', get(form, 'data.config'));
          return record.save().then(resolve);
        }
      });
    });
  }

  getDefaultActionModel() {
    return {
      name: 'Edit JSON config'
    };
  }
}
