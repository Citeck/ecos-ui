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
        label: '',
        key: 'action',
        type: 'columns',
        columns: [
          {
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
                }
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
                label: 'Action type',
                type: 'select',
                input: false,
                placeholder: 'Select action type',
                key: 'type',
                dataSrc: 'values',
                data: {
                  values: [Types.JS, Types.TRIGGER]
                }
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
                ]
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
    weight: 21
  }
];
