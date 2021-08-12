import isEmpty from 'lodash/isEmpty';

import { goToCardDetailsPage } from '../../../../../helpers/urls';
import Records from '../../../Records';
import { showForm } from '../../util/actionUtils';
import ActionsExecutor from '../ActionsExecutor';
import FormManager from '../../../../EcosForm/FormManager';
import { SourcesId } from '../../../../../constants';
import { NotificationManager } from 'react-notifications';
import { t } from '../../../../../helpers/export/util';

export default class CreateAction extends ActionsExecutor {
  static ACTION_ID = 'create';

  async execForRecord(record, action, context) {
    const { config = {} } = action;

    const onSubmitAction = (resolve, record) => {
      const { redirectToPage = true } = config;

      record.update();
      resolve(true);

      if (redirectToPage) {
        record.id && goToCardDetailsPage(record.id);
      }
    };

    if (config.typeRef) {
      // You should use ${att_name} instead of $att_name in this mode
      const resolvedTypeRef = config.typeRef.replace(SourcesId.TYPE, SourcesId.RESOLVED_TYPE);
      let variant;
      if (config.createVariant) {
        variant = config.createVariant;
      } else {
        let createVariants = (await Records.get(resolvedTypeRef).load('createVariants[]?json', true)) || [];
        if (!createVariants.length) {
          NotificationManager.error('', t('records-actions.create.create-variants-not-found'));
          return;
        }
        if (config.createVariantId) {
          variant = createVariants.filter(v => v.id === config.createVariantId)[0];
          if (!variant) {
            NotificationManager.error(
              '',
              t('records-actions.create.create-variant-with-id-not-found', {
                id: config.createVariantId
              })
            );
            return;
          }
        } else {
          variant = createVariants[0];
        }
      }
      variant = { ...variant };
      if (!variant.typeRef) {
        variant.typeRef = config.typeRef;
      }
      variant.attributes = {
        ...(variant.attributes || {}),
        ...(config.attributes || {})
      };
      variant.formOptions = {
        ...(variant.formOptions || {}),
        ...(config.options || {}),
        actionRecord: record.id
      };
      if (!variant.formRef) {
        variant.formRef = await Records.get(resolvedTypeRef).load('formRef?id', true);
      }

      return new Promise(resolve => {
        FormManager.createRecordByVariant(variant, {
          onSubmit: record => onSubmitAction(resolve, record),
          onModalCancel: () => resolve(false)
        });
      });
    }

    // legacy logic

    const fromRecordRegexp = /^\$/;
    const attributesFromRecord = {};

    Object.entries(config.attributes || {})
      .filter(entry => fromRecordRegexp.test(entry[1]))
      .forEach(entry => {
        attributesFromRecord[entry[0]] = entry[1].replace(fromRecordRegexp, '');
      });

    return new Promise(resolve => {
      const params = {
        attributes: config.attributes || {},
        options: { ...(config.options || {}), actionRecord: record.id },
        onSubmit: record => onSubmitAction(resolve, record),
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
