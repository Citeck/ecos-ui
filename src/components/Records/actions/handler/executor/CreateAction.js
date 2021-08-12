import isEmpty from 'lodash/isEmpty';
import values from 'lodash/values';
import findIndex from 'lodash/findIndex';

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
      let variant = null;
      if (config.createVariant && findIndex(values(config.createVariant), v => !!v) !== -1) {
        variant = config.createVariant;
      }
      if (!variant) {
        const resolvedTypeRef = config.typeRef.replace(SourcesId.TYPE, SourcesId.RESOLVED_TYPE);
        let createVariants = (await Records.get(resolvedTypeRef).load('createVariants[]?json', true)) || [];
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
          if (createVariants.length) {
            variant = createVariants[0];
          } else {
            variant = {};
          }
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
      const attsToLoadFromType = {};
      if (!variant.formRef) {
        attsToLoadFromType['formRef'] = 'formRef?id';
      }
      if (!variant.sourceId) {
        attsToLoadFromType['sourceId'] = 'sourceId';
      }
      if (Object.keys(attsToLoadFromType).length) {
        const resolvedTypeRef = variant.typeRef.replace(SourcesId.TYPE, SourcesId.RESOLVED_TYPE);
        const atts = await Records.get(resolvedTypeRef).load(attsToLoadFromType, true);
        for (let att in atts) {
          if (atts.hasOwnProperty(att)) {
            variant[att] = atts[att];
          }
        }
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
