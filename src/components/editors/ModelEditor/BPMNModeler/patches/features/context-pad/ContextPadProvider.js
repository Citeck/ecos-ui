import { EVENT_BASED_GATEWAY } from '@citeck/constants/bpmn';
import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';

const originGetContextPadEntries = ContextPadProvider.prototype.getContextPadEntries;

const disabledActionsMap = {
  [EVENT_BASED_GATEWAY]: [
    'append.receive-task', // ReceiveTask
    'append.message-intermediate-event' // MessageIntermediateCatchEvent
  ]
};

ContextPadProvider.prototype.getContextPadEntries = function (element) {
  const actions = originGetContextPadEntries.call(this, element);

  const disabledActions = disabledActionsMap[element.type];

  if (disabledActions && disabledActions.length) {
    return Object.entries(actions).reduce(
      (result, [key, value]) => (disabledActions.includes(key) ? result : { ...result, [key]: value }),
      {}
    );
  }

  return actions;
};

export default ContextPadProvider;
