import { t } from '../../../../../helpers/export/util';

const DATA_PROP = 'source.ajax.data';
const RES_MAPPING_PROP = 'source.ajax.mapping';

export default [
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'source.ajax.url',
    label: 'URL',
    validate: {
      required: true
    }
  },
  {
    type: 'radio',
    inline: true,
    clearOnHide: false,
    input: true,
    get label() {
      return this._label || t('form-constructor.tabs.content.source.ajax.method');
    },
    set label(label) {
      this._label = label;
    },
    key: 'source.ajax.method',
    values: [
      {
        label: 'GET',
        value: 'GET'
      },
      {
        label: 'POST',
        value: 'POST'
      }
    ],
    defaultValue: 'GET',
    validate: {
      required: true
    }
  },
  {
    type: 'panel',
    get title() {
      return t('form-constructor.tabs.content.source.ajax.data-js');
    },
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(DATA_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: DATA_PROP,
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
          return t('form-constructor.panel.executionCondition');
        }
      }
    ]
  },
  {
    type: 'panel',
    get title() {
      return t('form-constructor.tabs.content.source.ajax.mapping-js');
    },
    collapsible: true,
    collapsed: true,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(RES_MAPPING_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: RES_MAPPING_PROP,
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.panel.executionCondition');
        }
      }
    ]
  }
];
