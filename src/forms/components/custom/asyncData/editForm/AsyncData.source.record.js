import { t } from '../../../../../helpers/export/util';

export default [
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'source.record.id',
    get label() {
      return t('form-constructor.tabs.content.source.record.id');
    },
    get tooltip() {
      return t('form-constructor.tabs-tooltip.source.record.id');
    },
    validate: {
      required: true
    }
  },
  {
    weight: 200,
    type: 'datamap',
    get label() {
      return t('form-constructor.tabs.content.source.record.attributes');
    },
    get tooltip() {
      return t('form-constructor.tabs-tooltip.source.record.attributes');
    },
    key: 'source.record.attributes',
    clearOnHide: false,
    valueComponent: {
      type: 'textfield',
      key: 'value',
      get label() {
        return t('form-constructor.tabs-content.source.record.attribute');
      },
      defaultValue: '',
      input: true
    },
    validate: {
      required: true
    }
  }
];
