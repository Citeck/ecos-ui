import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';
import EditFormUtils from 'formiojs/components/base/editForm/utils';
import set from 'lodash/set';
import i18next from '../../../../i18next';
import { getCurrentLocale } from '../../../../../helpers/export/util';

BaseEditData.splice(0, BaseEditData.length);

const { translation } = i18next['options']['resources'][getCurrentLocale()];

const settings = [
  {
    type: 'textfield',
    label: translation.defaultValue,
    key: 'defaultValue',
    weight: 100,
    placeholder: 'Default Value',
    tooltip: 'The will be the value for this field, before user interaction. Having a default value will override the placeholder text.',
    input: true
  },
  {
    type: 'select',
    input: true,
    key: 'refreshOn',
    label: translation.refreshOn,
    weight: 110,
    tooltip: 'Refresh data when another field changes.',
    dataSrc: 'custom',
    valueProperty: 'value',
    data: {
      custom(context) {
        var values = [];
        values.push({ label: 'Any Change', value: 'data' });
        context.utils.eachComponent(context.instance.root.editForm.components, function(component, path) {
          if (component.key !== context.data.key) {
            values.push({
              label: component.label || component.key,
              value: path
            });
          }
        });
        return values;
      }
    }
  },
  {
    type: 'checkbox',
    input: true,
    weight: 111,
    key: 'clearOnRefresh',
    label: translation.clearOnRefresh,
    tooltip: 'When the Refresh On field is changed, clear this components value.'
  },
  EditFormUtils.javaScriptValue(
    'Custom Default Value',
    'customDefaultValue',
    'customDefaultValue',
    120,
    '<p><h4>Example:</h4><pre>value = data.firstName + " " + data.lastName;</pre></p>',
    '<p><h4>Example:</h4><pre>{"cat": [{"var": "data.firstName"}, " ", {"var": "data.lastName"}]}</pre>'
  ),
  EditFormUtils.javaScriptValue(
    'Calculated Value',
    'calculateValue',
    'calculateValue',
    130,
    '<p><h4>Example:</h4><pre>value = data.a + data.b + data.c;</pre></p>',
    '<p><h4>Example:</h4><pre>{"sum": [{"var": "data.a"}, {"var": "data.b"}, {"var": "data.c"}]}</pre><p><a target="_blank" href="http://formio.github.io/formio.js/app/examples/calculated.html">Click here for an example</a></p>'
  ),
  {
    type: 'checkbox',
    input: true,
    weight: 131,
    key: 'allowCalculateOverride',
    label: translation.allowCalculateOverride,
    tooltip: 'When checked, this will allow the user to manually override the calculated value.'
  },
  {
    weight: 400,
    type: 'checkbox',
    label: translation.encrypted,
    tooltip: 'Encrypt this field on the server. This is two way encryption which is not be suitable for passwords.',
    key: 'encrypted',
    input: true
  },
  {
    type: 'checkbox',
    input: true,
    weight: 500,
    key: 'dbIndex',
    label: translation.dbIndex,
    tooltip: 'Set this field as an index within the database. Increases performance for submission queries.'
  }
];

BaseEditData.push({
  type: 'checkbox',
  input: true,
  weight: 132,
  key: 'triggerChangeWhenCalculate',
  label: `Trigger the "change" event if calculated value changed`,
  tooltip: 'Use it if you need refresh dependent components when this component CALCULATED value changed'
});

settings.map(item => {
  return BaseEditData.push(item);
});

set(BaseEditData.find(item => item.key === 'refreshOn'), 'multiple', true);

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
