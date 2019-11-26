export default [
  {
    type: 'select',
    input: true,
    label: 'Update on:',
    key: 'update.type',
    dataSrc: 'values',
    defaultValue: 'disabled',
    data: {
      values: [
        { label: 'Any change', value: 'any-change' },
        { label: 'Event', value: 'event' },
        { label: 'Once', value: 'once' },
        { label: 'Disabled', value: 'disabled' }
      ]
    }
  },
  {
    weight: 10,
    type: 'textfield',
    input: true,
    key: 'update.event',
    label: 'Event:',
    clearOnHide: false,
    validate: {
      required: true
    },
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.update.type' }, 'event'] }]
      }
    }
  },
  {
    type: 'checkbox',
    input: true,
    key: 'update.force',
    label: 'Force update',
    weight: 18,
    defaultValue: false,
    description: 'Should check when subscribe to event from TableForm',
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.update.type' }, 'event'] }]
      }
    }
  },
  {
    weight: 10,
    type: 'number',
    input: true,
    key: 'update.rate',
    label: 'Update rate, ms:',
    clearOnHide: false,
    validate: {
      required: true
    },
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.update.type' }, 'any-change'] }]
      }
    }
  },
  {
    type: 'select',
    input: true,
    label: 'Refresh on:',
    key: 'refreshOn',
    dataSrc: 'custom',
    multiple: true,
    data: {
      custom: `
        utils.eachComponent(instance.root.editForm.components, function(component, path) {
          if (component.key != data.key) {
            values.push({
              label: component.key,
              value: path
            });
          }
        });
      `
    }
  },
  {
    type: 'checkbox',
    input: true,
    key: 'triggerEventOnChange',
    label: 'Trigger event on change value',
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
    type: 'textfield',
    input: true,
    key: 'eventDelay',
    label: 'Event delay',
    defaultValue: 1500,
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
    type: 'panel',
    title: 'Execution condition',
    collapsible: true,
    collapsed: false,
    style: {
      'margin-bottom': '10px'
    },
    key: 'executionCondition-js',
    components: [
      {
        type: 'textarea',
        key: 'executionCondition',
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
  }
];
