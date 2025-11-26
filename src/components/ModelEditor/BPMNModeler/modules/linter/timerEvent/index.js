import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { BPMN_LINT_PREFIX } from '../constants';

import { PREFIX_FIELD } from '@/constants/cmmn';
import { t } from '@/helpers/util';

const TIMER_EVENT_DEFINITION = 'bpmn:TimerEventDefinition';

const timerEventHasType = {
  id: 'time-event-has-type',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, TIMER_EVENT_DEFINITION))) {
        return;
      }

      const timeConfigAttr = `${PREFIX_FIELD}timeConfig`;
      const timeConfig = JSON.parse(get(node.$attrs, [timeConfigAttr], '{}'));
      const type = (timeConfig.type || '').trim();

      if (!type) {
        reporter.report(node.id, t('bpmn-linter.timer-event.no-type'));
      }
    };

    return {
      check
    };
  }
};

const timerEventHasValue = {
  id: 'time-event-has-value',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find(def => is(def, TIMER_EVENT_DEFINITION))) {
        return;
      }

      const timeConfigAttr = `${PREFIX_FIELD}timeConfig`;
      const timeConfig = JSON.parse(get(node.$attrs, [timeConfigAttr], '{}'));
      const value = (timeConfig.value || '').trim();

      if (!value) {
        reporter.report(node.id, t('bpmn-linter.timer-event.no-value'));
      }
    };

    return {
      check
    };
  }
};

export const timerEventRulesMap = {
  [timerEventHasType.id]: 'error',
  [timerEventHasValue.id]: 'error'
};

export const timerEventCacheMap = {
  [`${BPMN_LINT_PREFIX}${timerEventHasType.id}`]: timerEventHasType.callback,
  [`${BPMN_LINT_PREFIX}${timerEventHasValue.id}`]: timerEventHasValue.callback
};
