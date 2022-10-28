import ReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider';

import { GATEWAY_TYPES, TASK_TYPES } from '../../../../../../constants/bpmn';

const originCreateEntries = ReplaceMenuProvider.prototype._createEntries;
const originGetHeaderEntries = ReplaceMenuProvider.prototype.getHeaderEntries;

const disabledReplaceMenuForTasks = [
  'replace-with-rule-task', // Business rule
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
  'replace-with-terminate-end', // Terminate End Event
  'replace-with-escalation-end', // Escalation End Event
  'replace-with-error-end' // Error End Event
];
const disabledReplaceMenuForGateway = [
  'replace-with-inclusive-gateway', // Inclusive Gateway
  'replace-with-complex-gateway', // Complex Gateway
  'replace-with-event-based-gateway' // Event based Gateway
];

const disabledHeaderEntries = [
  'toggle-loop' // Loop
];
const disabledHeaderEntriesByElements = {
  'bpmn:SubProcess': [
    'toggle-adhoc' // Ad-hoc
  ]
};

ReplaceMenuProvider.prototype._createEntries = function(element, replaceOptions) {
  if (TASK_TYPES.includes(element.type)) {
    replaceOptions = replaceOptions.filter(option => !disabledReplaceMenuForTasks.includes(option.actionName));
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
