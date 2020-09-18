import NumberEditor from 'formiojs/components/number/Number.form';
import NumberEditData from 'formiojs/components/number/editForm/Number.edit.data';

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
          }
        ]
      }
    ],
    ...extend
  );
}
