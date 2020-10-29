import isEmpty from 'lodash/isEmpty';

import { goToCardDetailsPage } from '../../../../../helpers/urls';
import Records from '../../../Records';
import { showForm } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class CreateAction extends ActionsExecutor {
  static ACTION_ID = 'create';

  async execForRecord(record, action, context) {
    const fromRecordRegexp = /^\$/;
    const { config = {} } = action;
    const attributesFromRecord = {};

    Object.entries(config.attributes || {})
      .filter(entry => fromRecordRegexp.test(entry[1]))
      .forEach(entry => {
        attributesFromRecord[entry[0]] = entry[1].replace(fromRecordRegexp, '');
      });

    return new Promise(resolve => {
      const params = {
        attributes: config.attributes || {},
        options: config.options || {},
        onSubmit: record => {
          const { redirectToPage = true } = config;

          record.update();
          resolve(true);

          if (redirectToPage) {
            record.id && goToCardDetailsPage(record.id);
          }
        },
        onFormCancel: () => resolve(false)
      };

      if (!!config.formId) {
        params.formId = config.formId;
      } else {
        params.formKey = config.formKey;
      }

      try {
        if (!isEmpty(attributesFromRecord)) {
          Records.get(record)
            .load(attributesFromRecord)
            .then(result => {
              params.attributes = Object.assign({}, params.attributes, result);
              showForm(config.recordRef, params);
            });
        } else {
          showForm(config.recordRef, params);
        }
      } catch (e) {
        console.error(e);
        resolve(false);
      }
    });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.create',
      icon: 'icon-small-plus'
    };
  }
}
