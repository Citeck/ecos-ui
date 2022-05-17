import set from 'lodash/set';
import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';
import { t } from '../../../../../helpers/export/util';

BaseEditData.push({
  type: 'checkbox',
  input: true,
  weight: 132,
  key: 'triggerChangeWhenCalculate',
  label: `Trigger the "change" event if calculated value changed`,
  tooltip: 'Use it if you need refresh dependent components when this component CALCULATED value changed'
});

set(BaseEditData.find(item => item.key === 'refreshOn'), 'multiple', true);

const inputFormat = BaseEditData.find(item => item.key === 'inputFormat');

if (inputFormat) {
  inputFormat.data.values = [
    {
      get label() {
        return t('form-constructor.select.plain');
      },
      value: 'plain'
    },
    {
      get label() {
        return 'HTML';
      },
      value: 'html'
    },
    {
      get label() {
        return t('form-constructor.select.raw');
      },
      value: 'raw'
    }
  ];
}

const customDefaultValuePanel = BaseEditData.find(item => item.key === 'customDefaultValuePanel');

if (customDefaultValuePanel) {
  customDefaultValuePanel.components = [
    {
      type: 'htmlelement',
      tag: 'div',
      get content() {
        return t('form-constructor.html.htmlelement1');
      }
    },
    {
      type: 'panel',
      key: 'customDefaultValue-js',
      label: 'JavaScript',
      collapsible: true,
      collapsed: false,
      components: [
        {
          type: 'textarea',
          key: 'customDefaultValue',
          rows: 5,
          editor: 'ace',
          hideLabel: true,
          input: true
        },
        {
          type: 'htmlelement',
          tag: 'div',
          get content() {
            return t('form-constructor.html.htmlelement2');
          }
        }
      ]
    },
    {
      type: 'panel',
      key: 'customDefaultValue-json',
      label: 'JSONLogic',
      collapsible: true,
      collapsed: true,
      components: [
        {
          type: 'htmlelement',
          tag: 'div',
          get content() {
            return t('form-constructor.html.htmlelement3');
          }
        },
        {
          type: 'textarea',
          key: 'customDefaultValue',
          rows: 5,
          editor: 'ace',
          hideLabel: true,
          input: true
        }
      ]
    }
  ];
}

const calculatedValuePanel = BaseEditData.find(item => item.key === 'calculateValuePanel');

if (calculatedValuePanel) {
  calculatedValuePanel.components = [
    {
      type: 'htmlelement',
      tag: 'div',
      get content() {
        return t('form-constructor.html.htmlelement1');
      }
    },
    {
      type: 'panel',
      key: 'customDefaultValue-js',
      label: 'JavaScript',
      collapsible: true,
      collapsed: false,
      components: [
        {
          type: 'textarea',
          key: 'calculateValue',
          rows: 5,
          editor: 'ace',
          hideLabel: true,
          input: true
        },
        {
          type: 'htmlelement',
          tag: 'div',
          get content() {
            return t('form-constructor.html.htmlelement8');
          }
        }
      ]
    },
    {
      type: 'panel',
      key: 'calculateValue-json',
      label: 'JSONLogic',
      collapsible: true,
      collapsed: true,
      components: [
        {
          type: 'htmlelement',
          tag: 'div',
          get content() {
            return t('form-constructor.html.htmlelement9');
          }
        },
        {
          type: 'textarea',
          key: 'calculateValue',
          rows: 5,
          editor: 'ace',
          hideLabel: true,
          input: true
        }
      ]
    }
  ];
}

const refreshOn = BaseEditData.find(item => item.key === 'refreshOn');

if (refreshOn) {
  refreshOn.data = {
    custom: `
        values.push({label: 'Any Change', value: 'data'});
        utils.eachComponent(instance.root.editForm.components, function(component, path) {
          if (component.key !== data.key) {          
            values.push({
              label: component.labelByLocale || utils.getTextByLocale(component.label) || component.label || component.key,
              value: path
            });
          }
        });
      `
  };
}

export default BaseEditData;
