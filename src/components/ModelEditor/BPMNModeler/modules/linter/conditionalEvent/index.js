import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { BPMN_LINT_PREFIX } from '../constants';

import { PREFIX_FIELD } from '@/constants/cmmn';
import { t } from '@/helpers/util';

const CONDITIONAL_EVENT_DEFINITION = 'bpmn:ConditionalEventDefinition';

const conditionalEventHasConditionalType = {
  id: 'conditional-event-has-conditional-type',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find((def) => is(def, CONDITIONAL_EVENT_DEFINITION))) {
        return;
      }

      const conditionTypeAttr = `${PREFIX_FIELD}conditionType`;
      const conditionType = get(node.$attrs, [conditionTypeAttr], '').trim();

      if (!conditionType) {
        reporter.report(node.id, t('bpmn-linter.conditional-event.no-conditional-type'));
      }
    };

    return {
      check,
    };
  },
};

const conditionalEventHasScript = {
  id: 'conditional-event-has-script',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find((def) => is(def, CONDITIONAL_EVENT_DEFINITION))) {
        return;
      }

      const conditionTypeAttr = `${PREFIX_FIELD}conditionType`;
      const conditionConfigAttr = `${PREFIX_FIELD}conditionConfig`;

      const conditionType = get(node.$attrs, [conditionTypeAttr], '').trim();
      const conditionConfig = JSON.parse(get(node.$attrs, [conditionConfigAttr], '{}'));
      const script = (conditionConfig.fn || '').trim();

      if (conditionType === 'SCRIPT' && !script) {
        reporter.report(node.id, t('bpmn-linter.conditional-event.no-script'));
      }
    };

    return {
      check,
    };
  },
};

const conditionalEventHasExpression = {
  id: 'conditional-event-has-expression',
  callback: () => {
    const check = (node, reporter) => {
      if (!node.eventDefinitions || !node.eventDefinitions.find((def) => is(def, CONDITIONAL_EVENT_DEFINITION))) {
        return;
      }

      const conditionTypeAttr = `${PREFIX_FIELD}conditionType`;
      const conditionConfigAttr = `${PREFIX_FIELD}conditionConfig`;

      const conditionType = get(node.$attrs, [conditionTypeAttr], '').trim();
      const conditionConfig = JSON.parse(get(node.$attrs, [conditionConfigAttr], '{}'));
      const expression = (conditionConfig.expression || '').trim();

      if (conditionType === 'EXPRESSION' && !expression) {
        reporter.report(node.id, t('bpmn-linter.conditional-event.no-expression'));
      }
    };

    return {
      check,
    };
  },
};

export const conditionalEventRulesMap = {
  [conditionalEventHasConditionalType.id]: 'error',
  [conditionalEventHasScript.id]: 'error',
  [conditionalEventHasExpression.id]: 'error',
};

export const conditionalEventCacheMap = {
  [`${BPMN_LINT_PREFIX}${conditionalEventHasConditionalType.id}`]: conditionalEventHasConditionalType.callback,
  [`${BPMN_LINT_PREFIX}${conditionalEventHasScript.id}`]: conditionalEventHasScript.callback,
  [`${BPMN_LINT_PREFIX}${conditionalEventHasExpression.id}`]: conditionalEventHasExpression.callback,
};
