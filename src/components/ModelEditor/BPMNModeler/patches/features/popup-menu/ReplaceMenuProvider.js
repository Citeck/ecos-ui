import ReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider';
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { filter } from 'min-dash';
import { isDifferentType } from 'bpmn-js/lib/features/popup-menu/util/TypeUtil';
import get from 'lodash/get';
import set from 'lodash/set';

import {
  ECOS_TASK_BASE_ELEMENT,
  ECOS_TASK_TYPE_SET_STATUS,
  GATEWAY_TYPES,
  REPLACE_TO_SET_STATUS,
  TASK_TYPES
} from '../../../../../../constants/bpmn';
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
const originGetHeaderEntries = ReplaceMenuProvider.prototype.getPopupMenuHeaderEntries;

const disableReplaceMenuForStart = [
  'replace-with-conditional-start', // Conditional Start Event
  'replace-with-message-start' // Message Start Event
];

const disabledReplaceMenuForTasks = [
  'replace-with-manual-task', // Manual Task
  'replace-with-receive-task' // Receive task
];

const disabledReplaceMenuForEvents = [
  'replace-with-escalation-intermediate-throw', // Escalation Intermediate Throw Event
  'replace-with-compensation-intermediate-throw', // Compensation Intermediate Throw Event
  'replace-with-link-intermediate-throw', // Link Intermediate Throw Event
  'replace-with-link-intermediate-catch', // Link Intermediate Catch Event
  'replace-with-compensation-end', // Compensation End Event
  'replace-with-escalation-end' // Escalation End Event
];

const disabledForBoundaryEvents = [
  'replace-with-message-boundary', // Message Boundary Event
  'replace-with-escalation-boundary', // Escalation Boundary Event
  'replace-with-compensation-boundary', // Compensation Boundary Event
  'replace-with-non-interrupting-message-boundary', // Message Boundary Event (non-interrupting)
  'replace-with-non-interrupting-escalation-boundary' // Escalation Boundary Event (non-interrupting)
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

const disabledReplaceMenuForSubprocess = [
  'replace-with-transaction' // Transaction
];

const disabledEventSubProcess = [
  'replace-with-transaction' // Transaction
];

const disabledSubProcessStartEvent = [
  'replace-with-message-start', // Message Start Event
  'replace-with-non-interrupting-message-start', // Message Start Event (non-interrupting)
  'replace-with-escalation-start', // Escalation Start Event
  'replace-with-non-interrupting-escalation-start', // Escalation Start Event (non-interrupting)
  'replace-with-compensation-start' // Compensation Start Event
];

const disabledIntermidiateEvent = [
  'replace-with-message-intermediate-catch', // Message Intermediate Catch Event
  'replace-with-message-intermediate-throw' // Message Intermediate Throw Event
];

const disabledEndEvent = [
  'replace-with-message-end' // Message End Event
];

//TODO: find a better way to disable elements
ReplaceMenuProvider.prototype.getPopupMenuEntries = function(element) {
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
    entries = filter(START_EVENT, function(entry) {
      return differentType(entry) && !disableReplaceMenuForStart.includes(entry.actionName);
    });

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
      return (
        !disabledSubProcessStartEvent.includes(entry.actionName) &&
        (differentType(entry) || (!differentType(entry) && !isInterruptingEqual))
      );
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

      return !disabledEndEvent.includes(entry.actionName) && differentType(entry);
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

      return (
        !disabledForBoundaryEvents.includes(entry.actionName) && (differentType(entry) || (!differentType(entry) && !isCancelActivityEqual))
      );
    });

    return this._createEntries(element, entries);
  }

  // intermediate events
  if (is(businessObject, 'bpmn:IntermediateCatchEvent') || is(businessObject, 'bpmn:IntermediateThrowEvent')) {
    entries = filter(INTERMEDIATE_EVENT, function(entry) {
      return !disabledIntermidiateEvent.includes(entry.actionName) && differentType(entry);
    });

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
    entries = filter(EVENT_SUB_PROCESS, function(entry) {
      return !disabledEventSubProcess.includes(entry.actionName) && differentType(entry);
    });

    return this._createEntries(element, entries);
  }

  // expanded sub processes
  if (is(businessObject, 'bpmn:SubProcess') && isExpanded(element)) {
    entries = filter(SUBPROCESS_EXPANDED, function(entry) {
      return differentType(entry) && !disabledReplaceMenuForSubprocess.includes(entry.actionName);
    });

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
    entries = filter(TASK, function(entry) {
      const target = entry.target;

      return differentType(entry) || get(element, 'businessObject.taskType') !== target.taskType;
    });

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

    Object.keys(originEntities).forEach(originKey => {
      const originAction = originEntities[originKey].action;

      originEntities[originKey] = {
        ...originEntities[originKey],
        action: (...props) => {
          const resultElement = originAction.call(this, ...props);

          set(resultElement, 'businessObject.taskType', originKey === REPLACE_TO_SET_STATUS ? ECOS_TASK_TYPE_SET_STATUS : undefined);

          return resultElement;
        }
      };
    });

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

ReplaceMenuProvider.prototype.getPopupMenuHeaderEntries = function(element) {
  let entries = originGetHeaderEntries.call(this, element);

  if (Object.keys(disabledHeaderEntriesByElements).includes(element.type)) {
    entries = Object.entries(entries).reduce(
      (result, [currentKey, currentValue]) =>
        disabledHeaderEntriesByElements[element.type].includes(currentKey) ? result : { ...result, [currentKey]: currentValue },
      {}
    );
  }

  if (element.type === ECOS_TASK_BASE_ELEMENT && get(element, 'businessObject.taskType')) {
    return {};
  }

  return Object.entries(entries).reduce(
    (result, [currentKey, currentValue]) =>
      disabledHeaderEntries.includes(currentKey) ? result : { ...result, [currentKey]: currentValue },
    {}
  );
};
