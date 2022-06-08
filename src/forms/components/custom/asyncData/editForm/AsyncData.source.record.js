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
    set label(label) {
      this._label = label;
    },
    get tooltip() {
      return t('form-constructor.tabs-tooltip.source.record.id');
    },
    set tooltip(tooltip) {
      this._tooltip = tooltip;
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
    set label(label) {
      this._label = label;
    },
    get tooltip() {
      return t('form-constructor.tabs-tooltip.source.record.attributes');
    },
    set tooltip(tooltip) {
      this._tooltip = tooltip;
    },
    key: 'source.record.attributes',
    clearOnHide: false,
    valueComponent: {
      type: 'textfield',
      key: 'value',
      get label() {
        return t('form-constructor.tabs-content.source.record.attribute');
      },
      set label(label) {
        this._label = label;
      },
      defaultValue: '',
      input: true
    },
    validate: {
      required: true
    }
  }
];
