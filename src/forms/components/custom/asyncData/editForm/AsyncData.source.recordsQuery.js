import { t } from '../../../../../helpers/export/util';

const QUERY_PROP = 'source.recordsQuery.query';

export default [
  {
    type: 'panel',
    get title() {
      return t('form-constructor.tabs-content.source.recordsQuery.query-js');
    },
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(QUERY_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: QUERY_PROP,
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
    key: 'source.recordsQuery.attributes',
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
    }
  },
  {
    type: 'checkbox',
    get label() {
      return t('form-constructor.tabs-content.source.recordsQuery.isSingle');
    },
    set label(label) {
      this._label = label;
    },
    labelPosition: 'left-left',
    shortcut: '',
    tableView: true,
    alwaysEnabled: false,
    input: true,
    key: 'source.recordsQuery.isSingle',
    defaultValue: false
  }
];
