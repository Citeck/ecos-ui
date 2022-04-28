import BaseEditConditional from 'formiojs/components/base/editForm/Base.edit.conditional';
import EditFormUtils from './utils';

const simpleConditional = BaseEditConditional.find(item => item.key === 'simple-conditional');

if (simpleConditional && simpleConditional.components) {
  console.log('SIMPLE', simpleConditional);
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

BaseEditConditional.push({
  components: [
    EditFormUtils.logicVariablesTable(''),
    {
      type: 'textarea',
      key: 'dataPreProcessingCode1',
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
          <p>Data pre-processing after receiving the specified URL. Enter custom JavaScript code.</p>
          <p>You must assign the <strong>values</strong> variable.</p>
          <h5>Example:</h5>
          <pre>values = _.sortBy(queryResult, "label");</pre>
        </small>`
    }
  ]
});

export default BaseEditConditional;
