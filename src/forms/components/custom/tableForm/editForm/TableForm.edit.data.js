const CUSTOM_CREATE_VARIANTS_FIELD = 'customCreateVariantsJs';
const VALUE_FORM_KEY_FIELD = 'computed.valueFormKey';

export default [
  {
    type: 'checkbox',
    input: true,
    key: 'triggerEventOnChange',
    label: 'Trigger event on table change',
    weight: 18,
    defaultValue: false
  },
  {
    type: 'textfield',
    input: true,
    key: 'eventName',
    label: 'Event name',
    placeholder: 'Some string',
    validate: {
      required: false
    },
    weight: 19,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.triggerEventOnChange' }, true] }]
      }
    }
  },
  {
    type: 'select',
    input: true,
    label: 'Data source:',
    key: 'source.type',
    dataSrc: 'values',
    defaultValue: 'journal',
    data: {
      values: [{ label: 'Journal', value: 'journal' }, { label: 'Custom', value: 'custom' }]
    },
    weight: 20
  },
  {
    type: 'textfield',
    input: true,
    key: 'source.journal.journalId',
    label: 'Journal ID',
    placeholder: 'Example: legal-entities',
    validate: {
      required: false
    },
    weight: 21,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'journal'] }]
      }
    }
  },
  {
    type: 'ecosSelect',
    input: true,
    key: 'source.journal.columns',
    label: 'Columns for display',
    weight: 22,
    defaultValue: [],
    multiple: true,
    data: { custom: ' values = data.displayColumnsAsyncData' },
    template: '<span>{{ item.label }}</span>',
    refreshOn: 'displayColumnsAsyncData',
    clearOnRefresh: true,
    dataSrc: 'custom',
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'journal'] }]
      }
    }
  },
  {
    label: 'Columns',
    disableAddingRemovingRows: false,
    defaultOpen: false,
    addAnother: '',
    addAnotherPosition: 'bottom',
    mask: false,
    tableView: true,
    alwaysEnabled: false,
    type: 'datagrid',
    input: true,
    key: 'source.custom.columns',
    components: [
      {
        label: 'Column field name',
        allowMultipleMasks: false,
        showWordCount: false,
        showCharCount: false,
        tableView: true,
        alwaysEnabled: false,
        type: 'textfield',
        input: true,
        key: 'name',
        widget: {
          type: ''
        },
        row: '0-0'
      },
      {
        type: 'panel',
        title: 'Formatter',
        collapsible: true,
        collapsed: true,
        style: {
          'margin-bottom': '20px'
        },
        key: ''.concat('custom-formatter-js'),
        components: [
          {
            type: 'textarea',
            key: 'formatter',
            rows: 5,
            editor: 'ace',
            hideLabel: true,
            input: true,
            placeholder: `value = { name: 'FormatterClassName', params: {} };`
          },
          {
            type: 'htmlelement',
            tag: 'div',
            content: '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable.</p>'
          }
        ]
      }
    ],
    weight: 21,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'custom'] }]
      }
    }
  },
  {
    weight: 25,
    type: 'panel',
    title: 'Custom Create Variants',
    collapsible: true,
    collapsed: true,
    style: {
      'margin-bottom': '20px'
    },
    key: ''.concat(CUSTOM_CREATE_VARIANTS_FIELD, '-js'),
    components: [
      {
        type: 'textarea',
        key: CUSTOM_CREATE_VARIANTS_FIELD,
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable.</p>'
      }
    ]
  },
  {
    weight: 28,
    type: 'panel',
    title: 'Value Form Key',
    collapsible: true,
    collapsed: true,
    style: {
      'margin-bottom': '20px'
    },
    key: ''.concat(VALUE_FORM_KEY_FIELD, '-js'),
    components: [
      {
        type: 'textarea',
        key: VALUE_FORM_KEY_FIELD,
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable. You can use "record" variable.</p>'
      }
    ]
  },
  {
    type: 'asyncData',
    input: true,
    key: 'displayColumnsAsyncData',
    label: 'Async Data',
    inputType: 'asyncData',
    source: {
      type: 'custom',
      custom: {
        syncData: `
          value={
            journalId: data.source.journal.journalId || data._journalId
          };
        `,
        asyncData: `
          if (!data.journalId) {
            return [];
          }
          
          return fetch('/share/proxy/alfresco/api/journals/config?journalId=' + data.journalId, {
            credentials: 'include',
            headers: {
              'Content-type': 'application/json;charset=UTF-8'
            },
          }).then(r => r.json()).then(config => {
            if (config.columns && Array.isArray(config.columns)) {
              return config.columns.map(function (item) {
                return {
                  label: item.text,
                  value: item.attribute
                };
              });
            }
            
            return [];
          });
        `
      },
      recordsQuery: { query: '', attributes: {}, isSingle: false }
    },
    update: { type: 'any-change', event: '', rate: 100 }
  }
];
