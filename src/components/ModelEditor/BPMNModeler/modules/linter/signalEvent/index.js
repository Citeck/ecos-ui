import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { PREFIX_FIELD } from '../../../../../../constants/cmmn';
import { t } from '../../../../../../helpers/util';
import { BPMN_LINT_PREFIX } from '../constants';

const SIGNAL_EVENT_DEFINITION = 'bpmn:SignalEventDefinition';

const signalEventHasEventType = {
  id: 'signal-event-has-event-type',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, SIGNAL_EVENT_DEFINITION))) {
        return;
      }

      const eventManualModeAttr = `${PREFIX_FIELD}eventManualMode`;
      const eventTypeAttr = `${PREFIX_FIELD}eventType`;

      const eventManualMode = JSON.parse(get(node.$attrs, [eventManualModeAttr], 'false'));
      const eventType = get(node.$attrs, [eventTypeAttr], '').trim();

      if (!eventManualMode && !eventType) {
        reporter.report(node.id, t('bpmn-linter.signal-event.no-event-type'));
      }
    };

    return {
      check
    };
  }
};

const signalEventHasSignalName = {
  id: 'signal-event-has-signal-name',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, SIGNAL_EVENT_DEFINITION))) {
        return;
      }

      const eventManualModeAttr = `${PREFIX_FIELD}eventManualMode`;
      const manualSignalNameAttr = `${PREFIX_FIELD}manualSignalName`;

      const eventManualMode = JSON.parse(get(node.$attrs, [eventManualModeAttr], 'false'));
      const manualSignalName = get(node.$attrs, [manualSignalNameAttr], '').trim();

      if (eventManualMode && !manualSignalName) {
        reporter.report(node.id, t('bpmn-linter.signal-event.no-signal-name'));
      }
    };

    return {
      check
    };
  }
};

const userEventIsSetOnUserEventSignal = {
  id: 'user-event-is-set-on-user-event-signal',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, SIGNAL_EVENT_DEFINITION))) {
        return;
      }

      const eventTypeAttr = `${PREFIX_FIELD}eventType`;
      const userEventAtt = `${PREFIX_FIELD}userEvent`;

      const eventType = get(node.$attrs, [eventTypeAttr], '').trim();
      const userEvent = get(node.$attrs, [userEventAtt], '').trim();

      if (eventType === 'USER_EVENT' && !userEvent) {
        reporter.report(node.id, t('bpmn-linter.signal-event.no-user-event'));
      }
    };

    return {
      check
    };
  }
};

const signalEventHasFilterEventByDocumentType = {
  id: 'signal-event-has-filter-event-by-document-type',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, SIGNAL_EVENT_DEFINITION))) {
        return;
      }
      const eventTypeAttr = `${PREFIX_FIELD}eventType`;
      const eventFilterByEcosTypeAttr = `${PREFIX_FIELD}eventFilterByEcosType`;
      const eventFilterByPredicateAttr = `${PREFIX_FIELD}eventFilterByPredicate`;
      const eventFilterByRecordTypeAttr = `${PREFIX_FIELD}eventFilterByRecordType`;

      const eventType = get(node.$attrs, [eventTypeAttr], '').trim();
      const eventFilterByEcosType = get(node.$attrs, [eventFilterByEcosTypeAttr], '').trim();
      const eventFilterByRecordType = get(node.$attrs, [eventFilterByRecordTypeAttr], '').trim();
      const eventFilterByPredicate = get(node.$attrs, [eventFilterByPredicateAttr], '').trim();

      if (eventType === 'RECORD_CREATED' && eventFilterByRecordType === 'ANY' && !eventFilterByPredicate && !eventFilterByEcosType) {
        reporter.report(node.id, t('bpmn-linter.signal-event.has-filter-event-by-document-type'));
      }
    };

    return {
      check
    };
  }
};

const signalEventHasEventFilter = {
  id: 'signal-event-has-event-filter',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, SIGNAL_EVENT_DEFINITION))) {
        return;
      }

      const eventTypeAttr = `${PREFIX_FIELD}eventType`;
      const eventFilterByRecordTypeAttr = `${PREFIX_FIELD}eventFilterByRecordType`;

      const eventType = get(node.$attrs, [eventTypeAttr], '').trim();
      const eventFilterByRecordType = get(node.$attrs, [eventFilterByRecordTypeAttr], '').trim();

      if (eventType !== 'RECORD_CREATED' && !eventFilterByRecordType) {
        reporter.report(node.id, t('bpmn-linter.signal-event.no-event-filter'));
      }
    };

    return {
      check
    };
  }
};

const signalEventHasVariableName = {
  id: 'signal-event-has-variable-name',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, SIGNAL_EVENT_DEFINITION))) {
        return;
      }

      const eventFilterByRecordTypeAttr = `${PREFIX_FIELD}eventFilterByRecordType`;
      const eventFilterByRecordVariableAttr = `${PREFIX_FIELD}eventFilterByRecordVariable`;

      const eventFilterByRecordType = get(node.$attrs, [eventFilterByRecordTypeAttr], '').trim();
      const eventFilterByRecordVariable = get(node.$attrs, [eventFilterByRecordVariableAttr], '').trim();

      if (eventFilterByRecordType === 'DOCUMENT_BY_VARIABLE' && !eventFilterByRecordVariable) {
        reporter.report(node.id, t('bpmn-linter.signal-event.no-variable-name'));
      }
    };

    return {
      check
    };
  }
};

const signalEventHasRecordFields = {
  id: 'signal-event-has-record-fields',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, SIGNAL_EVENT_DEFINITION))) {
        return;
      }

      const eventTypeAttr = `${PREFIX_FIELD}eventType`;
      const eventFilterByRecordTypeAttr = `${PREFIX_FIELD}eventFilterByRecordType`;
      const eventFilterByPredicateAttr = `${PREFIX_FIELD}eventFilterByPredicate`;

      const eventType = get(node.$attrs, [eventTypeAttr], '').trim();
      const eventFilterByRecordType = get(node.$attrs, [eventFilterByRecordTypeAttr], '').trim();
      const eventFilterByPredicate = get(node.$attrs, [eventFilterByPredicateAttr], '').trim();

      if (eventType === 'RECORD_CREATED' && !eventFilterByRecordType && !eventFilterByPredicate) {
        reporter.report(node.id, t('bpmn-linter.signal-event.no-event-filter-by-doc-or-predicate'));
      }
    };

    return {
      check
    };
  }
};

export const signalEventRulesMap = {
  [signalEventHasEventType.id]: 'error',
  [signalEventHasSignalName.id]: 'error',
  [signalEventHasEventFilter.id]: 'error',
  [signalEventHasVariableName.id]: 'error',
  [signalEventHasRecordFields.id]: 'error',
  [signalEventHasFilterEventByDocumentType.id]: 'error',
  [userEventIsSetOnUserEventSignal.id]: 'error'
};

export const signalEventCacheMap = {
  [`${BPMN_LINT_PREFIX}${signalEventHasEventType.id}`]: signalEventHasEventType.callback,
  [`${BPMN_LINT_PREFIX}${signalEventHasSignalName.id}`]: signalEventHasSignalName.callback,
  [`${BPMN_LINT_PREFIX}${signalEventHasEventFilter.id}`]: signalEventHasEventFilter.callback,
  [`${BPMN_LINT_PREFIX}${signalEventHasVariableName.id}`]: signalEventHasVariableName.callback,
  [`${BPMN_LINT_PREFIX}${signalEventHasRecordFields.id}`]: signalEventHasRecordFields.callback,
  [`${BPMN_LINT_PREFIX}${[signalEventHasFilterEventByDocumentType.id]}`]: signalEventHasFilterEventByDocumentType.callback,
  [`${BPMN_LINT_PREFIX}${userEventIsSetOnUserEventSignal.id}`]: userEventIsSetOnUserEventSignal.callback
};
