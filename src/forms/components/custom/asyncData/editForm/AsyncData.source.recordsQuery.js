import { t } from '../../../../../helpers/export/util';

const QUERY_PROP = 'source.recordsQuery.query';

export default [
  {
    type: 'panel',
    title: t('form-constructor.tabs-content.source.recordsQuery.query-js'),
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
        content: t('form-constructor.panel.executionCondition')
      }
    ]
  },
  {
    weight: 200,
    type: 'datamap',
    label: t('form-constructor.tabs.content.source.recordsQuery.attributes'),
    tooltip: t('form-constructor.tabs-tooltip.source.recordsQuery.attributes'),
    key: 'source.recordsQuery.attributes',
    clearOnHide: false,
    valueComponent: {
      type: 'textfield',
      key: 'value',
      label: t('form-constructor.tabs-content.source.record.attribute'),
      defaultValue: '',
      input: true
    }
  },
  {
    type: 'checkbox',
    label: t('form-constructor.tabs-content.source.recordsQuery.isSingle'),
    labelPosition: 'left-left',
    shortcut: '',
    tableView: true,
    alwaysEnabled: false,
    input: true,
    key: 'source.recordsQuery.isSingle',
    defaultValue: false
  }
];
