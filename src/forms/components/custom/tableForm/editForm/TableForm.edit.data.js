import { t } from '../../../../../helpers/export/util';

const CUSTOM_CREATE_VARIANTS_FIELD = 'customCreateVariantsJs';
const VALUE_FORM_KEY_FIELD = 'computed.valueFormKey';

export default [
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
      values: [
        {
          label: {
            ru: 'Журнал',
            en: 'Journal'
          },
          value: 'journal'
        },
        {
          label: {
            ru: 'Пользовательские',
            en: 'Custom'
          },
          value: 'custom'
        }
      ]
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
    label: {
      ru: 'Колонки',
      en: 'Columns'
    },
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
                label: {
                  ru: 'Имя атрибуты столбца',
                  en: 'Column attribute name'
                },
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
                title: {
                  ru: 'Форматирование',
                  en: 'Formatter'
                },
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
                    get content() {
                      return t('form-constructor.panel.executionCondition');
                    }
                  }
                ]
              },
              {
                type: 'checkbox',
                input: true,
                key: 'setAttributesManually',
                label: {
                  ru: 'Установить атрибуты вручную',
                  en: 'Set attributes manually'
                },
                defaultValue: false
              },
              {
                label: {
                  ru: 'Заголовок колонки',
                  en: 'Column title'
                },
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
                label: {
                  ru: 'Тип данных колонки:',
                  en: 'Column data type:'
                },
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
                label: {
                  ru: 'Выбор нескольких',
                  en: 'Multiple'
                },
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
    weight: 21,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'custom'] }]
      }
    }
  },
  {
    type: 'checkbox',
    input: true,
    key: 'isSelectableRows',
    label: {
      ru: 'Выбираемые строки',
      en: 'Selectable rows'
    },
    weight: 23,
    defaultValue: false
  },
  {
    type: 'panel',
    title: {
      ru: 'Указать невыбираемые строки',
      en: 'Specify nonselectable rows'
    },
    collapsible: true,
    collapsed: true,
    key: 'nonSelectableRowsJS-js',
    customClass: 'form-builder__panel-js',
    components: [
      {
        type: 'textarea',
        key: 'nonSelectableRowsJS',
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.html.table.nonselectable');
        }
      }
    ],
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.isSelectableRows' }, true] }]
      }
    },
    weight: 23
  },
  {
    type: 'panel',
    title: {
      ru: 'Указать выбираемые строки',
      en: 'Specify selected rows'
    },
    collapsible: true,
    collapsed: true,
    key: 'selectedRowsJS-js',
    customClass: 'form-builder__panel-js',
    components: [
      {
        type: 'textarea',
        key: 'selectedRowsJS',
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.html.table.nonselectable');
        }
      }
    ],
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.isSelectableRows' }, true] }]
      }
    },
    weight: 23
  },
  {
    type: 'checkbox',
    input: true,
    key: 'triggerEventOnChange',
    label: {
      ru: 'Инициировать событие при изменении таблицы',
      en: 'Trigger event on table change'
    },
    weight: 24,
    defaultValue: false
  },
  {
    weight: 25,
    type: 'panel',
    title: {
      ru: 'Пользовательские варианты создания',
      en: 'Custom Create Variants'
    },
    collapsible: true,
    collapsed: true,
    customClass: 'form-builder__panel-js',
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
        get content() {
          return t('form-constructor.panel.executionCondition');
        }
      }
    ]
  },
  {
    weight: 28,
    type: 'panel',
    title: {
      ru: 'Ключ формы значения',
      en: 'Value Form Key'
    },
    collapsible: true,
    collapsed: true,
    customClass: 'form-builder__panel-js',
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
        get content() {
          return t('form-constructor.html.table-form');
        }
      }
    ]
  },
  {
    type: 'asyncData',
    input: true,
    key: 'displayColumnsAsyncData',
    label: {
      ru: 'Асинхронные данные',
      en: 'Async Data'
    },
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
                    
          return window.Citeck.Journals.getJournalConfig(data.journalId).then(config => {
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
