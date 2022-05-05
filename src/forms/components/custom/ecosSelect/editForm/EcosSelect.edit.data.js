import SelectEditData from 'formiojs/components/select/editForm/Select.edit.data';
import EditFormUtils from 'formiojs/components/base/editForm/utils';
import { t } from '../../../../../helpers/export/util';

SelectEditData.push(
  {
    type: 'panel',
    title: 'Data pre-processing',
    collapsible: true,
    collapsed: true,
    customClass: 'form-builder__panel-js',
    key: 'dataPreProcessingCode-panel',
    weight: 10,
    components: [
      EditFormUtils.logicVariablesTable(`<tr><th>queryResult</th><td>${t('form-constructor.table.queryResult')}</td></tr>`),
      {
        type: 'textarea',
        key: 'dataPreProcessingCode',
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.panel.data-preporocessing');
        }
      }
    ],
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
        content: `<p>${t('form-constructor.panel.data-custom-js')}</p>`
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
