import get from 'lodash/get';
import set from 'lodash/set';
import BaseEditLogic from 'formiojs/components/base/editForm/Base.edit.logic';

const advancedLogicComponent = BaseEditLogic.find(item => item.key === 'logic');
const actionsGrid = get(advancedLogicComponent, 'components', []).find(item => item.key === 'actions');
const actionPanel = get(actionsGrid, 'components', []).find(item => item.key === 'actionPanel');
const actionTypeProperty = get(actionPanel, 'components', []).find(item => item.key === 'property');
const triggerPanel = get(advancedLogicComponent, 'components', []).find(item => item.key === 'triggerPanel');

// Cause: https://citeck.atlassian.net/browse/ECOSUI-1259
if (triggerPanel && triggerPanel.components) {
  const typeSimple = get(triggerPanel, 'components.0.components', []).find(item => item.key === 'simple');
  const conditionalWhen = get(typeSimple, 'components', []).find(item => item.key === 'when');

  if (conditionalWhen) {
    conditionalWhen.data = {
      custom: `
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
}

BaseEditLogic.push({
  key: 'logic',
  cancelRow: 'Cancel'
});

// Cause: https://citeck.atlassian.net/browse/ECOSCOM-3287
set(actionTypeProperty, 'data.json', [
  { label: 'Persistent', value: 'persistent', type: 'boolean' },
  ...get(actionTypeProperty, 'data.json', [])
]);

export default BaseEditLogic;
