import get from 'lodash/get';
import set from 'lodash/set';
import BaseEditLogic from 'formiojs/components/base/editForm/Base.edit.logic';

const advancedLogicComponent = BaseEditLogic.find(item => item.key === 'logic');
const actionsGrid = get(advancedLogicComponent, 'components', []).find(item => item.key === 'actions');
const actionPanel = get(actionsGrid, 'components', []).find(item => item.key === 'actionPanel');
const actionTypeProperty = get(actionPanel, 'components', []).find(item => item.key === 'property');

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
