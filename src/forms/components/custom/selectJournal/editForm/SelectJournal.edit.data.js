const CUSTOM_PREDICATE_FIELD = 'customPredicateJs';
const VALUE_DISPLAY_NAME_FIELD = 'computed.valueDisplayName';

export default [
  {
    type: 'textfield',
    input: true,
    key: 'journalId',
    label: 'Journal ID',
    placeholder: 'Example: legal-entities',
    validate: {
      required: false
    },
    weight: 20
  },
  {
    type: 'select',
    label: 'Data type',
    key: 'ecos.dataType',
    weight: 30,
    tooltip: 'Chose json-record if you with to save selected records data as json text',
    template: '<span>{{ item.label }}</span>',
    data: {
      values: [
        {
          value: 'assoc',
          label: 'Association'
        },
        {
          value: 'json-record',
          label: 'Json Record'
        }
      ]
    },
    defaultValue: 'assoc',
    input: true
  },
  {
    type: 'checkbox',
    input: true,
    key: 'hideCreateButton',
    label: 'Hide "Create" button',
    weight: 21,
    defaultValue: false
  },
  {
    type: 'ecosSelect',
    input: true,
    key: 'displayColumns',
    label: 'Columns for display',
    weight: 22,
    defaultValue: [],
    multiple: true,
    data: { custom: ' values = data.displayColumnsAsyncData' },
    template: '<span>{{ item.label }}</span>',
    refreshOn: 'displayColumnsAsyncData',
    clearOnRefresh: true,
    dataSrc: 'custom'
  },
  {
    weight: 25,
    type: 'panel',
    title: 'Custom Predicate',
    collapsible: true,
    collapsed: true,
    style: {
      'margin-bottom': '20px'
    },
    key: ''.concat(CUSTOM_PREDICATE_FIELD, '-js'),
    components: [
      {
        type: 'textarea',
        key: CUSTOM_PREDICATE_FIELD,
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
    weight: 25,
    type: 'panel',
    title: 'Value Display Name',
    collapsible: true,
    collapsed: true,
    style: {
      'margin-bottom': '20px'
    },
    key: ''.concat(VALUE_DISPLAY_NAME_FIELD, '-js'),
    components: [
      {
        type: 'textarea',
        key: VALUE_DISPLAY_NAME_FIELD,
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: '<p>Enter custom javascript code. You must assign the <strong>disp</strong> variable.</p>'
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
      type: 'ajax',
      ajax: {
        method: 'GET',
        url: '/api/journals/config',
        data: `
          value={
            journalId: data.journalId || data._journalId
          };
        `,
        mapping: `
          if (data.columns && Array.isArray(data.columns)) {
            value = data.columns.map(function (item) {
              return {
                label: item.text,
                value: item.attribute
              };
            });  
          } else {
            value = [];
          }
        `
      },
      record: { id: '', attributes: {} },
      recordsQuery: { query: '', attributes: {}, isSingle: false },
      custom: { syncData: {}, asyncData: {} }
    },
    update: { type: 'any-change', event: '', rate: 100 }
  }
];
