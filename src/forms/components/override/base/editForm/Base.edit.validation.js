import BaseEditValidation from 'formiojs/components/base/editForm/Base.edit.validation';
import i18next from '../../../../i18next';
import { getCurrentLocale } from '../../../../../helpers/export/util';
import EditFormUtils from 'formiojs/components/base/editForm/utils';

BaseEditValidation.splice(0, BaseEditValidation.length);

const { translation } = i18next['options']['resources'][getCurrentLocale()];

const settings = [
  {
    weight: 0,
    type: 'checkbox',
    label: translation['validate.required'],
    tooltip: 'A required field must be filled in before the form can be submitted.',
    key: 'validate.required',
    input: true
  },
  {
    weight: 100,
    type: 'checkbox',
    label: translation.unique,
    tooltip: 'Makes sure the data submitted for this field is unique, and has not been submitted before.',
    key: 'unique',
    input: true
  },
  {
    weight: 150,
    type: 'select',
    key: 'validateOn',
    defaultValue: 'change',
    input: true,
    label: translation.validateOn,
    tooltip: 'Determines when this component should trigger front-end validation.',
    dataSrc: 'values',
    data: {
      values: [{ label: translation['validateOn.change'], value: 'change' }, { label: translation['validateOn.blur'], value: 'blur' }]
    }
  },
  {
    weight: 200,
    key: 'validate.customMessage',
    label: translation['validate.customMessage'],
    placeholder: 'Custom Error Message',
    type: 'textfield',
    tooltip: 'Error message displayed if any error occurred.',
    input: true
  },
  {
    type: 'panel',
    title: translation['custom-validation-js'],
    collapsible: true,
    collapsed: true,
    style: { 'margin-bottom': '10px' },
    key: 'custom-validation-js',
    weight: 300,
    customConditional() {
      // return !Evaluator.noeval;
    },
    components: [
      EditFormUtils.logicVariablesTable('<tr><th>input</th><td>The value that was input into this component</td></tr>'),
      {
        type: 'textarea',
        key: 'validate.custom',
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        content: `
        <small>
          <p>Enter custom validation code.</p>
          <p>You must assign the <strong>valid</strong> variable as either <strong>true</strong> or an error message if validation fails.</p>
          <h5>Example:</h5>
          <pre>valid = (input === 'Joe') ? true : 'Your name must be "Joe"';</pre>
        </small>`
      },
      {
        type: 'well',
        components: [
          {
            weight: 100,
            type: 'checkbox',
            label: translation['validate.customPrivate'],
            tooltip:
              'Check this if you wish to perform the validation ONLY on the server side. This keeps your validation logic private and secret.',
            description:
              'Check this if you wish to perform the validation ONLY on the server side. This keeps your validation logic private and secret.',
            key: 'validate.customPrivate',
            input: true
          }
        ]
      }
    ]
  },
  {
    type: 'panel',
    title: translation['json-validation-json'],
    collapsible: true,
    collapsed: true,
    key: 'json-validation-json',
    weight: 400,
    components: [
      {
        type: 'htmlelement',
        tag: 'div',
        /* eslint-disable prefer-template */
        content:
          '<p>Execute custom logic using <a href="http://jsonlogic.com/" target="_blank">JSONLogic</a>.</p>' +
          '<h5>Example:</h5>' +
          '<pre>' +
          JSON.stringify(
            {
              if: [{ '===': [{ var: 'input' }, 'Bob'] }, true, "Your name must be 'Bob'!"]
            },
            null,
            2
          ) +
          '</pre>'
        /* eslint-enable prefer-template */
      },
      {
        type: 'textarea',
        key: 'validate.json',
        hideLabel: true,
        rows: 5,
        editor: 'ace',
        as: 'json',
        input: true
      }
    ]
  }
];

settings.map(item => {
  return BaseEditValidation.push(item);
});

BaseEditValidation.push({
  type: 'checkbox',
  input: true,
  weight: 1,
  clearOnHide: true,
  key: 'optionalWhenDisabled',
  label: translation.optionalWhenDisabled,
  tooltip: 'Allow form saving if the field at once disabled, required and empty'
});

export default BaseEditValidation;
