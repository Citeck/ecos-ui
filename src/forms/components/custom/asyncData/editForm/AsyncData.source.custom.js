import { t } from '../../../../../helpers/export/util';

const SYNC_DATA_PROP = 'source.custom.syncData';
const ASYNC_DATA_PROP = 'source.custom.asyncData';

export default [
  {
    type: 'panel',
    get title() {
      return t('form-constructor.tabs-content.source.custom.syncData-js');
    },
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(SYNC_DATA_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: SYNC_DATA_PROP,
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
          return t('form-constructor.html.source.custom.syncData-js');
        }
      }
    ]
  },
  {
    type: 'panel',
    get title() {
      return t('form-constructor.tabs-content.source.custom.asyncData-js');
    },
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: ''.concat(ASYNC_DATA_PROP, '-js'),
    components: [
      {
        type: 'textarea',
        key: ASYNC_DATA_PROP,
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
          return t('form-constructor.html.source.custom.asyncData-js');
        }
      }
    ]
  }
];
