import ActionsExecutor from '../ActionsExecutor';
import EcosFormUtils from '../../../../EcosForm/EcosFormUtils';
import { goToCardDetailsPage } from '../../../../../helpers/urls';
import isEmpty from 'lodash/isEmpty';
import Records from '../../../Records';

export default class CreateAction extends ActionsExecutor {
  static ACTION_ID = 'create';

  async execForRecord(record, action, context) {
    const fromRecordRegexp = /^\$/;
    const { config = {} } = action;
    const attributesFromRecord = {};
    const showForm = (recordRef, params) => {
      EcosFormUtils.eform(recordRef, {
        params: params,
        class: 'ecos-modal_width-lg',
        isBigHeader: true
      });
    };

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
