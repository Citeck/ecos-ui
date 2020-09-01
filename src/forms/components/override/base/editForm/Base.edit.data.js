import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';

BaseEditData.push({
  type: 'checkbox',
  input: true,
  weight: 132,
  key: 'triggerChangeWhenCalculate',
  label: `Trigger the "change" event if calculated value changed`,
  tooltip: 'Use it if you need refresh dependent components when this component CALCULATED value changed'
});

export default BaseEditData;
