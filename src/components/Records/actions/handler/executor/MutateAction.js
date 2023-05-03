import get from 'lodash/get';

import { t } from '../../../../../helpers/export/util';
import DialogManager from '../../../../common/dialogs/Manager';
import { replaceAttributeValues } from '../../../utils/recordUtils';
import Records from '../../../Records';
import { notifyFailure, notifySuccess } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';

export default class MutateAction extends ActionsExecutor {
  static ACTION_ID = 'mutate';

  async execForRecords(records, action, context) {
    const config = get(action, 'config', {});
    const implSourceId = get(config, 'implSourceId');

    if (implSourceId) {
      const implMutRecord = Records.get(implSourceId + '@');
      implMutRecord.att('records', records.map(record => record.id));
      implMutRecord.att('attributes', get(config, 'record.attributes', {}));
      implMutRecord.att('actionConfig', config);
      return await implMutRecord.save('?json');
    }

    const mutatedRecords = [];

    for (const record of records) {
      const recordConfig = await replaceAttributeValues(config, record);
      const recordId = get(recordConfig, 'record.id', record.id);
      const recordToMutate = Records.getRecordToEdit(recordId);
      const attributes = get(recordConfig, 'record.attributes');
      await this.saveMutatedRecord(recordToMutate, attributes, mutatedRecords, record);
    }

    return mutatedRecords;
  }

  async saveMutatedRecord(record, attributes, mutatedRecords, originalRecord) {
    for (const att in attributes) {
      if (attributes.hasOwnProperty(att)) {
        record.att(att, attributes[att]);
      }
    }

    let nodeRef = record.id;

    await record
      .save()
      .then(data => {
        if (data.isPendingCreate()) {
          nodeRef = originalRecord.id;
        }

        mutatedRecords.push({ status: 'OK', nodeRef, message: '' });
      })
      .catch(e => {
        if (record.isPendingCreate()) {
          nodeRef = originalRecord.id;
        }

        mutatedRecords.push({ status: 'SKIPPED', nodeRef, message: e.message });

        return false;
      });
  }

  async execForRecord(record, action, context) {
    const recordId = get(action, 'config.record.id');
    const attributes = get(action, 'config.record.attributes') || {};
    const _record = recordId ? Records.get(recordId) : record;

    for (const att in attributes) {
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
