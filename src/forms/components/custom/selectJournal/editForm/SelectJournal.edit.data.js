import { SortOrderOptions } from '../constants';

const CUSTOM_PREDICATE_FIELD = 'customPredicateJs';
const FILTER_PREDICATES_FIELD = 'presetFilterPredicatesJs';
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
    type: 'checkbox',
    input: true,
    key: 'isFullScreenWidthModal',
    label: 'Full-width modal',
    tooltip: 'Check to display modal window in full screen width',
    weight: 23
  },
  {
    weight: 25,
    type: 'panel',
    title: 'Custom Predicate',
    collapsible: true,
    collapsed: true,
    customClass: 'mb-3',
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
    customClass: 'mb-3',
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
    type: 'textfield',
    input: true,
    key: 'searchField',
    label: 'Search field name',
    placeholder: 'Example: name',
    description: 'If the field is blank, the search will be performed in all text fields',
    validate: {
      required: false
    },
    weight: 26
  },
  {
    weight: 27,
    type: 'panel',
    title: 'Preset filter predicates',
    collapsible: true,
    collapsed: true,
    customClass: 'mb-3',
    key: ''.concat(FILTER_PREDICATES_FIELD, '-js'),
    components: [
      {
        type: 'textarea',
        key: FILTER_PREDICATES_FIELD,
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
    weight: 29,
    type: 'panel',
    title: 'Sorting',
    collapsible: true,
    collapsed: true,
    customClass: 'mb-3',
    key: 'sorting',
    components: [
      {
        label: '',
        key: 'sortingColumns',
        type: 'columns',
        columns: [
          {
            components: [
              {
                label: 'Sort by attribute',
                type: 'textfield',
                input: true,
                key: 'sortAttribute',
                placeholder: 'Enter column name',
                defaultValue: 'sys:node-dbid'
              }
            ],
            xs: 0,
            sm: 12,
            md: 6,
            lg: 0,
            xl: 0,
            classes: ''
          },
          {
            components: [
              {
                label: 'Sort order',
                type: 'select',
                input: true,
                key: 'sortAscending',
                dataSrc: 'values',
                valueProperty: 'value',
                defaultValue: SortOrderOptions.ASC.value,
                searchEnabled: false,
                data: {
                  values: [SortOrderOptions.ASC, SortOrderOptions.DESC]
                }
              }
            ],
            xs: 0,
            sm: 12,
            md: 6,
            lg: 0,
            xl: 0,
            classes: ''
          }
        ]
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
