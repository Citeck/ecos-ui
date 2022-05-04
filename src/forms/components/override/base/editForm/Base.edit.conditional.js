import BaseEditConditional from 'formiojs/components/base/editForm/Base.edit.conditional';

const simpleConditional = BaseEditConditional.find(item => item.key === 'simple-conditional');

if (simpleConditional && simpleConditional.components) {
  const conditionalWhen = simpleConditional.components.find(item => item.key === 'conditional.when');

  if (conditionalWhen) {
    conditionalWhen.data = {
      custom: `
      utils.eachComponent(instance.root.editForm.components, function(component, path) {
        if (component.key !== data.key) {
          values.push({
            label: component.labelByLocale || utils.getTextByLocale(component.label) || component.label || component.key,
            value: component.key
          });
        }
      });
    `
    };
  }
}

export default BaseEditConditional;
