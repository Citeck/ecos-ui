import { Attributes, SourcesId } from '../../../../../constants';
import { t } from '../../../../../helpers/export/util';
import { DataTypes, DisplayModes, SearchInWorkspacePolicy, SearchWorkspacePolicyOptions, SortOrderOptions, TableTypes } from '../constants';

import Records from '@/components/Records';

const CUSTOM_QUERY_DATA_FIELD = 'queryData';
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
    key: 'searchInWorkspacePolicy',
    get label() {
      return t('workspace-polices.title');
    },
    defaultValue: SearchInWorkspacePolicy.CURRENT,
    weight: 60,
    template: '<span>{{ item.label }}</span>',
    data: {
      get values() {
        return SearchWorkspacePolicyOptions.map(({ value, label }) => ({ value, label: t(label) }));
      }
    },
    searchEnabled: false,
    removeItemButton: false,
    defaultValue: SearchInWorkspacePolicy.CURRENT,
    input: true
  },
  {
    type: 'select',
    key: 'searchInAdditionalWorkspaces',
    get label() {
      return t('workspace-polices.additional-title');
    },
    input: true,
    weight: 60,
    conditional: {
      json: {
        and: [
          { '!=': [{ var: 'data.searchInWorkspacePolicy' }, SearchInWorkspacePolicy.CURRENT] },
          { '!=': [{ var: 'data.searchInWorkspacePolicy' }, SearchInWorkspacePolicy.ALL] }
        ]
      }
    },
    dataSrc: 'custom',
    valueProperty: 'value',
    clearOnHide: true,
    multiple: true,
    data: {
      custom: function custom(context) {
        return Records.query(
          {
            sourceId: SourcesId.WORKSPACE,
            language: 'predicate'
          },
          { label: '?disp', value: '?localId' }
        ).then(({ records = [] }) => [...records]);
      }
    }
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
          value: DataTypes.ASSOC,
          label: {
            ru: 'Ассоциация',
            en: 'Association'
          }
        },
        {
          value: DataTypes.JSON_REC,
          label: {
            ru: 'Запись JSON',
            en: 'Json Record'
          }
        },
        {
          value: DataTypes.QUERY,
          label: 'Query'
        }
      ]
    },
    defaultValue: DataTypes.ASSOC,
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
    dataSrc: TableTypes.CUSTOM
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
          label: {
            ru: 'По умолчанию',
            en: 'Default'
          }
        },
        {
          value: DisplayModes.TABLE,
          label: {
            ru: 'Табличный',
            en: 'Table'
          }
        },
        {
          value: DisplayModes.CUSTOM,
          label: {
            ru: 'Пользовательские значения',
            en: 'Custom values'
          }
        }
      ]
    },
    removeItemButton: false,
    searchEnabled: false,
    defaultValue: DisplayModes.DEFAULT,
    input: true
  },
  {
    type: 'textarea',
    weight: 23,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.viewMode' }, DisplayModes.CUSTOM] }]
      }
    },
    input: true,
    key: 'source.customValues',
    label: {
      ru: 'Пользовательские значения',
      en: 'Custom values'
    },
    editor: 'ace',
    rows: 10,
    placeholder: 'values = [];'
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
          values: [
            {
              label: {
                ru: 'Журнал',
                en: 'Journal'
              },
              value: TableTypes.JOURNAL
            },
            {
              label: {
                ru: 'Пользовательский',
                en: 'Custom'
              },
              value: TableTypes.CUSTOM
            }
          ]
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
    weight: 24,
    conditional: {
      json: {
        and: [{ '!=': [{ var: 'data.source.viewMode' }, DisplayModes.CUSTOM] }]
      }
    },
    type: 'panel',
    title: {
      ru: 'Пользовательские данные запроса',
      en: 'Custom Query Data'
    },
    collapsible: true,
    collapsed: true,
    customClass: 'mb-3',
    key: ''.concat(CUSTOM_QUERY_DATA_FIELD, '-js'),
    components: [
      {
        type: 'textarea',
        key: CUSTOM_QUERY_DATA_FIELD,
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
  },
  {
    weight: 25,
    conditional: {
      json: {
        and: [{ '!=': [{ var: 'data.source.viewMode' }, DisplayModes.CUSTOM] }]
      }
    },
    type: 'panel',
    title: {
      ru: 'Пользовательский предикат',
      en: 'Custom Predicate'
    },
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
        get content() {
          return t('form-constructor.panel.executionCondition');
        }
      }
    ]
  },
  {
    weight: 25,
    conditional: {
      json: {
        and: [{ '!=': [{ var: 'data.source.viewMode' }, DisplayModes.CUSTOM] }]
      }
    },
    type: 'panel',
    title: {
      ru: 'Отображаемое имя значения',
      en: 'Value Display Name'
    },
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
        get content() {
          return t('form-constructor.panel.executionValueDisplayName');
        }
      }
    ]
  },
  {
    conditional: {
      json: {
        and: [{ '!=': [{ var: 'data.source.viewMode' }, DisplayModes.CUSTOM] }]
      }
    },
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
    conditional: {
      json: {
        and: [{ '!=': [{ var: 'data.source.viewMode' }, DisplayModes.CUSTOM] }]
      }
    },
    type: 'panel',
    title: {
      ru: 'Предикаты предустановленного фильтра',
      en: 'Preset filter predicates'
    },
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
        get content() {
          return t('form-constructor.panel.executionCondition');
        }
      }
    ]
  },
  {
    weight: 29,
    conditional: {
      json: {
        and: [{ '!=': [{ var: 'data.source.viewMode' }, DisplayModes.CUSTOM] }]
      }
    },
    type: 'panel',
    title: {
      ru: 'Сортировка',
      en: 'Sorting'
    },
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
                label: {
                  ru: 'Сортировать по атрибуту',
                  en: 'Sort by attribute'
                },
                type: 'textfield',
                input: true,
                key: 'sortAttribute',
                placeholder: {
                  ru: 'Введите название колонки',
                  en: 'Enter column name'
                },
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
                label: {
                  ru: 'Порядок сортировки',
                  en: 'Sort order'
                },
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
