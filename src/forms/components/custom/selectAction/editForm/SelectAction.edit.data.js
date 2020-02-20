import { Types } from '../constants';

export default [
  {
    label: 'Items',
    disableAddingRemovingRows: false,
    defaultOpen: false,
    addAnother: '',
    addAnotherPosition: 'bottom',
    mask: false,
    tableView: true,
    alwaysEnabled: true,
    type: 'datagrid',
    input: true,
    key: 'source.items',
    components: [
      {
        label: 'Action name',
        allowMultipleMasks: false,
        showWordCount: false,
        showCharCount: false,
        tableView: true,
        alwaysEnabled: false,
        type: 'textfield',
        input: true,
        key: 'name',
        placeholder: 'Enter action name',
        widget: {
          type: ''
        },
        row: '0-0'
      },
      {
        label: 'Action type',
        type: 'select',
        input: false,
        key: 'type',
        dataSrc: 'values',
        data: {
          values: [Types.JS, Types.TRIGGER]
        },
        row: '0-1'
      },
      {
        label: 'Action',
        type: 'panel',
        customClass: 'formio-select-action__editor-group',
        components: [
          {
            type: 'htmlelement',
            tag: 'div',
            customClass: 'mt-2',
            content: '<p>Select action type</p>',
            conditional: {
              json: {
                and: [{ '==': [{ var: 'row.type' }, false] }]
              }
            }
          },
          {
            type: 'panel',
            title: 'JavaScript',
            collapsible: true,
            collapsed: true,
            key: 'code-panel',
            components: [
              {
                type: 'textarea',
                key: 'code',
                rows: 5,
                editor: 'ace',
                hideLabel: true,
                input: true
              },
              {
                type: 'htmlelement',
                tag: 'div',
                content: '<p>Enter custom javascript code.</p>'
              }
            ],
            conditional: {
              json: {
                and: [{ '==': [{ var: 'row.type' }, Types.JS.value] }]
              }
            }
          },
          {
            label: false,
            allowMultipleMasks: false,
            showWordCount: false,
            showCharCount: false,
            tableView: true,
            alwaysEnabled: false,
            type: 'textfield',
            input: true,
            key: 'eventName',
            placeholder: 'Enter event name',
            widget: {
              type: ''
            },
            conditional: {
              json: {
                and: [{ '==': [{ var: 'row.type' }, Types.TRIGGER.value] }]
              }
            }
          }
        ],
        row: '0-2'
      }
    ],
    weight: 21
  }
];
