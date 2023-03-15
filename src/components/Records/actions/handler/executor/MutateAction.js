import get from 'lodash/get';

import { t } from '../../../../../helpers/export/util';
import DialogManager from '../../../../common/dialogs/Manager';
import FormManager from '../../../../EcosForm/FormManager';
import Records from '../../../Records';
import { notifyFailure, notifySuccess } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class MutateAction extends ActionsExecutor {
  static ACTION_ID = 'mutate';

  async execForRecords(records, action, context) {
    const implSourceId = get(action, 'implSourceId');
    const config = get(action, 'config', {});

    let attributes = get(config, 'attributes', []);
    if (!Array.isArray(attributes)) {
      attributes = attributes.split(',');
    }

    if (implSourceId) {
      const implMutRecord = Records.get(implSourceId + '@');
      implMutRecord.att('records', records);
      implMutRecord.att('attributes', attributes);
      implMutRecord.att('actionConfig', config);
      return await implMutRecord.save('?json');
    }

    const formKey = get(config, 'form_option_batch-edit-attribute', '');
    if (!formKey) {
      notifyFailure('record-action.msg.form-key-not-found');
      return;
    }

    return new Promise(resolve => {
      FormManager.openFormModal({
        record: '@',
        formKey,
        saveOnSubmit: false,
        onSubmit: async rec => {
          const mutatedRecords = [];

          for (const record of records) {
            for (let att of attributes) {
              const newAtt = await rec.load(att);
              record.att(att, newAtt);
            }
            await record
              .save()
              .then(() => mutatedRecords.push({ status: 'OK', nodeRef: record.id, message: '' }))
              .catch(e => {
                mutatedRecords.push({ status: 'SKIPPED', nodeRef: record.id, message: e.message });
                return false;
              });
          }

          resolve(mutatedRecords);
        }
      });
    });
  }

  async execForRecord(record, action, context) {
    const recordId = get(action, 'config.record.id');
    const attributes = get(action, 'config.record.attributes') || {};
    const _record = recordId ? Records.get(recordId) : record;

    for (let att in attributes) {
      if (attributes.hasOwnProperty(att)) {
        _record.att(att, attributes[att]);
      }
    }

    return _record
      .save()
      .then(() => {
        notifySuccess();
        return true;
      })
      .catch(e => {
        console.error(e);
        notifyFailure();
        e && e.message && DialogManager.showInfoDialog({ title: t('error'), text: e.message });
        return false;
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.mutate-action',
      icon: 'icon-arrow'
    };
  }
}
