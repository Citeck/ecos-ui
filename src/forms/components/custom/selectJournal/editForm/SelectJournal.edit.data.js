import { Attributes } from '../../../../../constants';
import { SortOrderOptions, TableTypes, DisplayModes } from '../constants';

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
    label: 'Select modal columns',
    weight: 22,
    defaultValue: [],
    multiple: true,
    data: { custom: ' values = data.displayColumnsAsyncData' },
    template: '<span>{{ item.label }}</span>',
    refreshOn: 'displayColumnsAsyncData',
    dataSrc: 'custom'
  },
  {
    type: 'select',
    label: 'Display mode',
    key: 'source.viewMode',
    weight: 23,
    tooltip: 'Select a data display mode',
    clearOnHide: false,
    template: '<span>{{ item.label }}</span>',
    data: {
      values: [
        {
          value: DisplayModes.DEFAULT,
          label: 'Default'
        },
        {
          value: DisplayModes.TABLE,
          label: 'Table'
        }
      ]
    },
    removeItemButton: false,
    searchEnabled: false,
    defaultValue: DisplayModes.DEFAULT,
    input: true
  },
  {
    type: 'well',
    weight: 23,
    customClass: 'mb-3',
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.viewMode' }, DisplayModes.TABLE] }]
      }
    },
    components: [
      {
        type: 'select',
        input: true,
        label: 'Data source:',
        key: 'source.type',
        dataSrc: 'values',
        clearOnHide: false,
        removeItemButton: false,
        searchEnabled: false,
        defaultValue: TableTypes.JOURNAL,
        data: {
          values: [{ label: 'Journal', value: TableTypes.JOURNAL }, { label: 'Custom', value: TableTypes.CUSTOM }]
        },
        conditional: {
          json: {
            and: [{ '==': [{ var: 'data.source.viewMode' }, DisplayModes.TABLE] }]
          }
        },
        weight: 1
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
            label: '',
            key: 'column-filed-layout',
            type: 'columns',
            columns: [
              {
                components: [
                  {
                    label: 'Column attribute name',
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
                    customClass: 'form-builder__panel-js',
                    key: ''.concat('custom-formatter-js'),
                    components: [
                      {
                        type: 'textarea',
                        key: 'formatter',
                        rows: 5,
                        editor: 'ace',
                        hideLabel: true,
                        input: true,
                        placeholder: `value = { type: 'formatterTypeName', config: {} };`
                      },
                      {
                        type: 'htmlelement',
                        tag: 'div',
                        content: '<p>Enter custom javascript code. You must assign the <strong>value</strong> variable.</p>'
                      }
                    ]
                  },
                  {
                    type: 'checkbox',
                    input: true,
                    key: 'setAttributesManually',
                    label: 'Set attributes manually',
                    defaultValue: false
                  },
                  {
                    label: 'Column title',
                    type: 'textfield',
                    input: true,
                    key: 'title',
                    widget: {
                      type: ''
                    },
                    conditional: {
                      json: {
                        and: [{ '==': [{ var: 'row.setAttributesManually' }, true] }]
                      }
                    }
                  },
                  {
                    type: 'select',
                    input: true,
                    label: 'Column data type:',
                    key: 'type',
                    dataSrc: 'values',
                    defaultValue: '',
                    data: {
                      values: [
                        { label: 'text', value: 'text' },
                        { label: 'int', value: 'int' },
                        { label: 'boolean', value: 'boolean' },
                        { label: 'date', value: 'date' },
                        { label: 'datetime', value: 'datetime' },
                        { label: 'options', value: 'options' },
                        { label: 'assoc', value: 'assoc' },
                        { label: 'person', value: 'person' },
                        { label: 'authority', value: 'authority' },
                        { label: 'authorityGroup', value: 'authorityGroup' },
                        { label: 'mltext', value: 'mltext' },
                        { label: 'long', value: 'long' },
                        { label: 'float', value: 'float' },
                        { label: 'double', value: 'double' }
                      ]
                    },
                    conditional: {
                      json: {
                        and: [{ '==': [{ var: 'row.setAttributesManually' }, true] }]
                      }
                    }
                  },
                  {
                    type: 'checkbox',
                    input: true,
                    key: 'multiple',
                    label: 'Multiple',
                    defaultValue: false,
                    conditional: {
                      json: {
                        and: [{ '==': [{ var: 'row.setAttributesManually' }, true] }]
                      }
                    }
                  }
                ],
                xs: 12,
                sm: 12,
                md: 12,
                lg: 12,
                xl: 12,
                classes: ''
              }
            ]
          }
        ],
        weight: 2,
        conditional: {
          json: {
            and: [{ '==': [{ var: 'data.source.type' }, TableTypes.CUSTOM] }]
          }
        }
      }
    ]
  },
  {
    type: 'checkbox',
    input: true,
    key: 'isFullScreenWidthModal',
    label: 'Full-width modal',
    tooltip: 'Check to display modal window in full screen width',
    weight: 24
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
                defaultValue: Attributes.DBID
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
