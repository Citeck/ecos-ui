import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';

import { t } from '../../../../../helpers/export/util';

BaseEditDisplay.push({
  type: 'checkbox',
  input: true,
  weight: 650,
  key: 'disableInlineEdit',
  get label() {
    return t('form-constructor.tabs-content.disableInlineEdit');
  }
});

const labelPosition = BaseEditDisplay.find(item => item.key === 'labelPosition');
const label = BaseEditDisplay.find(item => item.key === 'label');

if (label) {
  label.validate.required = false;
  label.tooltip = {
    get label() {
      return t('form-editor.label-field-tooltip');
    }
  };
}

if (labelPosition) {
  labelPosition.data.values = [
    {
      get label() {
        return t('form-constructor.select.top');
      },
      value: 'top'
    },
    {
      get label() {
        return t('form-constructor.select.left-l-align');
      },
      value: 'left-left'
    },
    {
      get label() {
        return t('form-constructor.select.left-r-align');
      },
      value: 'left-right'
    },
    {
      get label() {
        return t('form-constructor.select.right-l-align');
      },
      value: 'right-left'
    },
    {
      get label() {
        return t('form-constructor.select.right-r-align');
      },
      value: 'right-right'
    },
    {
      get label() {
        return t('form-constructor.select.bottom');
      },
      value: 'bottom'
    }
  ];
}

const widgetInput = BaseEditDisplay.find(item => item.key === 'widget.type');

if (widgetInput) {
  widgetInput.data.values = [
    {
      get label() {
        return t('form-constructor.select.widget.type');
      },
      value: 'calendar'
    }
  ];
}

const persistentRadio = BaseEditDisplay.find(item => item.key === 'persistent');

if (persistentRadio) {
  persistentRadio.values = [
    {
      get label() {
        return t('form-constructor.radio.none');
      },
      value: false
    },
    {
      get label() {
        return t('form-constructor.radio.server');
      },
      value: true
    },
    {
      get label() {
        return t('form-constructor.radio.client');
      },
      value: 'client-only'
    }
  ];
}

const mutatingFields = {
  label: { type: 'mlText' },
  placeholder: { type: 'mlText' },
  description: { type: 'mlText' },
  tooltip: { type: 'mlTextarea' }
};

const fields = Object.keys(mutatingFields);

export default BaseEditDisplay.map(item => {
  if (fields.includes(item.key)) {
    const data = mutatingFields[item.key];

    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        item[key] = data[key];
      }
    }
  }

  return item;
});
