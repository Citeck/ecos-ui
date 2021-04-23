import NumberEditor from 'formiojs/components/number/Number.form';
import NumberEditData from 'formiojs/components/number/editForm/Number.edit.data';
import NumberEditValidation from 'formiojs/components/number/editForm/Number.edit.validation';

export default function(...extend) {
  return NumberEditor(
    [
      {
        key: 'data',
        components: [
          ...NumberEditData,
          {
            label: 'Big number',
            type: 'checkbox',
            input: true,
            key: 'isBigNumber',
            defaultValue: false,
            weight: 10,
            tooltip: `If you select this option, then all numbers will be stored in string form.
Summing such values is considered string concatenation.
If the option is disabled, then too large numbers will immediately be truncated (the precision will decrease),
but this limitation should be taken as limitations of the data format.`
          },
          {
            weight: 71,
            type: 'textfield',
            label: 'Delimiter character',
            key: 'delimiterValue',
            customConditional: 'show = !!data.delimiter',
            input: true,
            defaultValue: '',
            clearOnHide: false,
            tooltip: `For the mask to work correctly, there are restrictions on symbols:
- it is advisable not to use the decimal separator (dot for all locale);
- do not use underscore (_) - a special character that is used in the component mask.`
          }
        ]
      },
      {
        key: 'validation',
        components: [
          ...NumberEditValidation,
          {
            type: 'checkbox',
            input: true,
            weight: 170,
            key: 'validate.integer',
            label: 'Only Integer',
            description: "If it's <code>true</code>, param 'Require Decimal' and linked will be ignored"
          }
        ]
      }
    ],
    ...extend
  );
}
