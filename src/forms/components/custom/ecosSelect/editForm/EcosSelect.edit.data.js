import SelectEditData from 'formiojs/components/select/editForm/Select.edit.data';

SelectEditData.push(
  {
    type: 'textarea',
    input: true,
    key: 'dataPreProcessingCode',
    label: 'Data pre-processing',
    editor: 'ace',
    rows: 5,
    weight: 10,
    placeholder: 'Ex: _.sortBy(queryResult, "label")',
    tooltip: `Data pre-processing after receiving the specified URL.
Enter custom JavaScript code.
<strong>queryResult</strong> - list received by specified api; <strong>_</strong> - instance of Lodash.
`,
    conditional: {
      json: {
        and: [{ '===': [{ var: 'data.dataSrc' }, 'url'] }]
      }
    }
  },
  {
    type: 'checkbox',
    input: true,
    key: 'unavailableItems.isActive',
    label: 'Unavailable items',
    tooltip: 'Configure items that will not be available for selection',
    weight: 18,
    defaultValue: false
  },
  {
    type: 'panel',
    title: 'JavaScript',
    collapsible: true,
    collapsed: false,
    key: 'unavailableItems.code-js',
    weight: 18,
    components: [
      {
        type: 'textarea',
        key: 'unavailableItems.code',
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true,
        placeholder: 'value = []'
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: '<p>Enter custom javascript code.</p>'
      }
    ],
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.unavailableItems.isActive' }, true] }]
      }
    }
  },
  {
    type: 'checkbox',
    input: true,
    key: 'refreshOnEvent',
    label: 'Refresh on event',
    weight: 18,
    defaultValue: false
  },
  {
    type: 'textfield',
    input: true,
    key: 'refreshEventName',
    label: 'Refresh event name',
    placeholder: 'Some string',
    validate: {
      required: false
    },
    weight: 19,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.refreshOnEvent' }, true] }]
      }
    }
  },
  {
    key: 'refreshOn',
    multiple: true
  }
);

for (let field of SelectEditData) {
  if (field.key === 'data.url') {
    field.defaultValue = '/citeck/ecos/records/query';
    field.clearOnHide = false;
    break;
  }
}

export default SelectEditData;
