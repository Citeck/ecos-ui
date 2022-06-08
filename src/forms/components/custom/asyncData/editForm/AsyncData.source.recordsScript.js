import { t } from '../../../../../helpers/export/util';

const RECORDS_SCRIPT_PROP = 'source.recordsScript.script';

export default [
  {
    type: 'panel',
    get title() {
      return t('form-constructor.tabs.content.source.recordsScript.script-js');
    },
    collapsible: false,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(RECORDS_SCRIPT_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: RECORDS_SCRIPT_PROP,
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true,
        validate: {
          required: true
        }
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.html.records-script');
        }
      }
    ]
  },
  {
    weight: 200,
    type: 'datamap',
    get label() {
      return t('form-constructor.tabs.content.source.recordsQuery.attributes');
    },
    set label(label) {
      this._label = label;
    },
    get tooltip() {
      return t('form-constructor.tabs-tooltip.source.recordsQuery.attributes');
    },
    set tooltip(tooltip) {
      this._tooltip = tooltip;
    },
    key: 'source.recordsScript.attributes',
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
