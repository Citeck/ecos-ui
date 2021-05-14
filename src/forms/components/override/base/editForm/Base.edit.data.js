import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';
import set from 'lodash/set';

BaseEditData.push({
  type: 'checkbox',
  input: true,
  weight: 132,
  key: 'triggerChangeWhenCalculate',
  label: `Trigger the "change" event if calculated value changed`,
  tooltip: 'Use it if you need refresh dependent components when this component CALCULATED value changed'
});

set(BaseEditData.find(item => item.key === 'refreshOn'), 'multiple', true);

export default BaseEditData;
