import { t } from '../../../../../helpers/export/util';

export default [
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'source.recordsArray.id',
    label: t('form-constructor.tabs-content.source.recordsArray.id'),
    tooltip: t('form-constructor.tabs-tooltip.source.recordsArray.id'),
    validate: {
      required: true
    }
  },
  {
    weight: 200,
    type: 'datamap',
    label: t('form-constructor.tabs-content.source.recordsArray.attributes'),
    tooltip: t('form-constructor.tabs-tooltip.source.recordsArray.attributes'),
    key: 'source.recordsArray.attributes',
    clearOnHide: false,
    valueComponent: {
      type: 'textfield',
      key: 'value',
      label: t('form-constructor.tabs-content.source.record.attribute'),
      defaultValue: '',
      input: true
    },
    validate: {
      required: true
    }
  }
];
