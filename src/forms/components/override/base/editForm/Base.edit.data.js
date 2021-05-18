import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';

BaseEditData.push(
  {
    type: 'checkbox',
    input: true,
    weight: 132,
    key: 'triggerChangeWhenCalculate',
    label: `Trigger the "change" event if calculated value changed`,
    tooltip: 'Use it if you need refresh dependent components when this component CALCULATED value changed'
  },
  {
    key: 'refreshOn',
    multiple: true
  }
);

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
