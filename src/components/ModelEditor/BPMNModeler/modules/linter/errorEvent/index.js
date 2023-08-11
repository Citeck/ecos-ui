import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { PREFIX_FIELD } from '../../../../../../constants/cmmn';
import { t } from '../../../../../../helpers/util';
import { BPMN_LINT_PREFIX } from '../constants';

const ERROR_EVENT_DEFINITION = 'bpmn:ErrorEventDefinition';
const END_EVENT = 'bpmn:EndEvent';

const errorEventHasErrorName = {
  id: 'error-event-has-error-name',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, ERROR_EVENT_DEFINITION))) {
        return;
      }

      const errorNameAttr = `${PREFIX_FIELD}errorName`;
      const errorName = get(node.$attrs, [errorNameAttr], '').trim();

      if (!errorName) {
        reporter.report(node.id, t('bpmn-linter.error-event.no-error-name'));
      }
    };

    return {
      check
    };
  }
};

const errorEndEventHasCode = {
  id: 'error-end-event-has-code',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, ERROR_EVENT_DEFINITION))) {
        return;
      }

      if (!is(node, END_EVENT)) {
        return;
      }

      const errorCodeAttr = `${PREFIX_FIELD}errorCode`;
      const errorCode = get(node.$attrs, [errorCodeAttr], '').trim();

      if (!errorCode) {
        reporter.report(node.id, t('bpmn-linter.error-event.code'));
      }
    };

    return {
      check
    };
  }
};

export const errorEventRulesMap = {
  [errorEventHasErrorName.id]: 'error',
  [errorEndEventHasCode.id]: 'error'
};

export const errorEventCacheMap = {
  [`${BPMN_LINT_PREFIX}${errorEventHasErrorName.id}`]: errorEventHasErrorName.callback,
  [`${BPMN_LINT_PREFIX}${errorEndEventHasCode.id}`]: errorEndEventHasCode.callback
};
