import ReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider';
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { filter } from 'min-dash';
import { isDifferentType } from 'bpmn-js/lib/features/popup-menu/util/TypeUtil';

import { GATEWAY_TYPES, TASK_TYPES } from '../../../../../../constants/bpmn';
import {
  BOUNDARY_EVENT,
  END_EVENT,
  EVENT_SUB_PROCESS,
  EVENT_SUB_PROCESS_START_EVENT,
  GATEWAY,
  INTERMEDIATE_EVENT,
  PARTICIPANT,
  SEQUENCE_FLOW,
  START_EVENT,
  START_EVENT_SUB_PROCESS,
  SUBPROCESS_EXPANDED,
  TASK,
  TRANSACTION
} from './ReplaceOptions';
import { isEventSubProcess } from '../../../utils';
import * as replaceOptions from 'bpmn-js/lib/features/replace/ReplaceOptions';
import { isExpanded } from 'bpmn-js/lib/util/DiUtil';

const originGetEntries = ReplaceMenuProvider.prototype.getPopupMenuEntries;
const originCreateEntries = ReplaceMenuProvider.prototype._createEntries;
const originGetHeaderEntries = ReplaceMenuProvider.prototype.getHeaderEntries;

const disabledReplaceMenuForTasks = [
  'replace-with-call-activity', // Call Activity
  'replace-with-manual-task', // Manual Task
  'replace-with-service-task', // Service task
  'replace-with-receive-task' // Receive task
];

const disabledReplaceMenuForEvents = [
  'replace-with-conditional-intermediate-catch', // Conditional Intermediate Catch Event
  'replace-with-none-intermediate-throw', // Intermediate Throw Event
  'replace-with-escalation-intermediate-throw', // Escalation Intermediate Throw Event
  'replace-with-compensation-intermediate-throw', // Compensation Intermediate Throw Event
  'replace-with-link-intermediate-throw', // Link Intermediate Throw Event
  'replace-with-link-intermediate-catch', // Link Intermediate Catch Event
  'replace-with-none-intermediate-throwing', // Intermediate Throw Event
  'replace-with-conditional-start', // Conditional Start Event
  'replace-with-compensation-end', // Compensation End Event
  'replace-with-escalation-end', // Escalation End Event
  'replace-with-error-end' // Error End Event
];

const disabledReplaceMenuForGateway = [
  'replace-with-complex-gateway' // Complex Gateway
];

const disabledHeaderEntries = [
  'toggle-loop' // Loop
];

const disabledHeaderEntriesByElements = {
  'bpmn:SubProcess': [
    'toggle-adhoc' // Ad-hoc
  ]
};

//TODO: find a better way to disable elements
ReplaceMenuProvider.prototype.getEntries = function(element) {
  const businessObject = element.businessObject;
  const differentType = isDifferentType(element);

  let entries;

  if (is(businessObject, 'bpmn:DataObjectReference')) {
    return this._createEntries(element, replaceOptions.DATA_OBJECT_REFERENCE);
  }

  if (is(businessObject, 'bpmn:DataStoreReference') && !is(element.parent, 'bpmn:Collaboration')) {
    return this._createEntries(element, replaceOptions.DATA_STORE_REFERENCE);
  }

  // start events outside sub processes
  if (is(businessObject, 'bpmn:StartEvent') && !is(businessObject.$parent, 'bpmn:SubProcess')) {
    entries = filter(START_EVENT, differentType);

    return this._createEntries(element, entries);
  }

  // expanded/collapsed pools
  if (is(businessObject, 'bpmn:Participant')) {
    entries = filter(PARTICIPANT, function(entry) {
      return isExpanded(element) !== entry.target.isExpanded;
    });

    return this._createEntries(element, entries);
  }

  // start events inside event sub processes
  if (is(businessObject, 'bpmn:StartEvent') && isEventSubProcess(businessObject.$parent)) {
    entries = filter(EVENT_SUB_PROCESS_START_EVENT, function(entry) {
      const target = entry.target;

      const isInterrupting = target.isInterrupting !== false;

      const isInterruptingEqual = getBusinessObject(element).isInterrupting === isInterrupting;

      // filters elements which types and event definition are equal but have have different interrupting types
      return differentType(entry) || (!differentType(entry) && !isInterruptingEqual);
    });

    return this._createEntries(element, entries);
  }

  // start events inside sub processes
  if (
    is(businessObject, 'bpmn:StartEvent') &&
    !isEventSubProcess(businessObject.$parent) &&
    is(businessObject.$parent, 'bpmn:SubProcess')
  ) {
    entries = filter(START_EVENT_SUB_PROCESS, differentType);

    return this._createEntries(element, entries);
  }

  // end events
  if (is(businessObject, 'bpmn:EndEvent')) {
    entries = filter(END_EVENT, function(entry) {
      const target = entry.target;

      // hide cancel end events outside transactions
      if (target.eventDefinitionType === 'bpmn:CancelEventDefinition' && !is(businessObject.$parent, 'bpmn:Transaction')) {
        return false;
      }

      return differentType(entry);
    });

    return this._createEntries(element, entries);
  }

  // boundary events
  if (is(businessObject, 'bpmn:BoundaryEvent')) {
    entries = filter(BOUNDARY_EVENT, function(entry) {
      const target = entry.target;

      if (target.eventDefinitionType === 'bpmn:CancelEventDefinition' && !is(businessObject.attachedToRef, 'bpmn:Transaction')) {
        return false;
      }
      const cancelActivity = target.cancelActivity !== false;

      const isCancelActivityEqual = businessObject.cancelActivity === cancelActivity;

      return differentType(entry) || (!differentType(entry) && !isCancelActivityEqual);
    });

    return this._createEntries(element, entries);
  }

  // intermediate events
  if (is(businessObject, 'bpmn:IntermediateCatchEvent') || is(businessObject, 'bpmn:IntermediateThrowEvent')) {
    entries = filter(INTERMEDIATE_EVENT, differentType);

    return this._createEntries(element, entries);
  }

  // gateways
  if (is(businessObject, 'bpmn:Gateway')) {
    entries = filter(GATEWAY, differentType);

    return this._createEntries(element, entries);
  }

  // transactions
  if (is(businessObject, 'bpmn:Transaction')) {
    entries = filter(TRANSACTION, differentType);

    return this._createEntries(element, entries);
  }

  // expanded event sub processes
  if (isEventSubProcess(businessObject) && isExpanded(element)) {
    entries = filter(EVENT_SUB_PROCESS, differentType);

    return this._createEntries(element, entries);
  }

  // expanded sub processes
  if (is(businessObject, 'bpmn:SubProcess') && isExpanded(element)) {
    entries = filter(SUBPROCESS_EXPANDED, differentType);

    return this._createEntries(element, entries);
  }

  // collapsed ad hoc sub processes
  if (is(businessObject, 'bpmn:AdHocSubProcess') && !isExpanded(element)) {
    entries = filter(TASK, function(entry) {
      const target = entry.target;

      const isTargetSubProcess = target.type === 'bpmn:SubProcess';

      const isTargetExpanded = target.isExpanded === true;

      return isDifferentType(element, target) && (!isTargetSubProcess || isTargetExpanded);
    });

    return this._createEntries(element, entries);
  }

  // sequence flows
  if (is(businessObject, 'bpmn:SequenceFlow')) {
    return this._createSequenceFlowEntries(element, SEQUENCE_FLOW);
  }

  // flow nodes
  if (is(businessObject, 'bpmn:FlowNode')) {
    entries = filter(TASK, differentType);

    // collapsed SubProcess can not be replaced with itself
    if (is(businessObject, 'bpmn:SubProcess') && !isExpanded(element)) {
      entries = filter(entries, function(entry) {
        return entry.label !== 'Sub Process (collapsed)';
      });
    }

    return this._createEntries(element, entries);
  }

  return originGetEntries.call(this, element);
};

ReplaceMenuProvider.prototype._createEntries = function(element, replaceOptions) {
  if (TASK_TYPES.includes(element.type)) {
    replaceOptions = replaceOptions.filter(option => !disabledReplaceMenuForTasks.includes(option.actionName));
    const originEntities = originCreateEntries.call(this, element, replaceOptions);

    Object.keys(originEntities).map(originKey => ({
      ...originEntities[originKey],
      action: (...props) => {
        element.businessObject.taskType = undefined;
        originEntities[originKey].action(props);
      }
    }));

    return originEntities;
  }

  if (GATEWAY_TYPES.includes(element.type)) {
    replaceOptions = replaceOptions.filter(option => !disabledReplaceMenuForGateway.includes(option.actionName));
  }

  if (element.businessObject.eventDefinitions || element.type.endsWith('Event')) {
    replaceOptions = replaceOptions.filter(option => !disabledReplaceMenuForEvents.includes(option.actionName));
  }

  return originCreateEntries.call(this, element, replaceOptions);
};

ReplaceMenuProvider.prototype.getHeaderEntries = function(element) {
  let entries = originGetHeaderEntries.call(this, element);

  if (Object.keys(disabledHeaderEntriesByElements).includes(element.type)) {
    entries = entries.filter(item => !disabledHeaderEntriesByElements[element.type].includes(item.id));
  }

  return entries.filter(item => !disabledHeaderEntries.includes(item.id));
};
