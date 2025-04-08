import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { BPMN_LINT_PREFIX } from '../constants';

import { PREFIX_FIELD } from '@/constants/cmmn';
import { t } from '@/helpers/util';

const SEQUENCE_FLOW = 'bpmn:SequenceFlow';
const EXCLUSIVE_GATEWAY = 'bpmn:ExclusiveGateway';
const INCLUSIVE_GATEWAY = 'bpmn:InclusiveGateway';

const CONDITION_TYPE_ATTR = `${PREFIX_FIELD}conditionType`;

const isDefaultFlow = (node, flow) => {
  return node['default'] === flow;
};

const hasCondition = flow => {
  const conditionType = get(flow.$attrs, [CONDITION_TYPE_ATTR], '').trim();

  return !!conditionType && conditionType !== 'NONE';
};

const sequenceFlowsFromGatewaysShouldBeDefault = {
  id: 'sequence-flow-from-gateways-should-be-default',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, EXCLUSIVE_GATEWAY) && !is(node, INCLUSIVE_GATEWAY)) {
        return;
      }

      const outgoing = node.outgoing || [];

      const noneConditionFlows = outgoing.filter(flow => get(flow.$attrs, CONDITION_TYPE_ATTR, '').trim() === 'NONE');

      if (noneConditionFlows.length === 1 && !isDefaultFlow(node, noneConditionFlows[0]) && outgoing.length > 1) {
        reporter.report(noneConditionFlows[0].id, t('bpmn-linter.sequence-flow.should-be-default'));
      }
    };

    return {
      check
    };
  }
};

const sequenceFlowsFromGatewaysAreCorrect = {
  id: 'sequence-flow-from-gateways-are-correct',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, EXCLUSIVE_GATEWAY) && !is(node, INCLUSIVE_GATEWAY)) {
        return;
      }

      const outgoing = node.outgoing || [];

      const hasOnlyOneNoneCondition = outgoing.filter(flow => get(flow.$attrs, CONDITION_TYPE_ATTR, '').trim() === 'NONE').length === 1;

      outgoing.forEach(flow => {
        const missingCondition = !hasCondition(flow) && !isDefaultFlow(node, flow);

        if (missingCondition && !hasOnlyOneNoneCondition) {
          reporter.report(flow.id, t('bpmn-linter.sequence-flow.missing-condition'));
        }
      });
    };

    return {
      check
    };
  }
};

const sequenceFlowHasCorrectConditionType = {
  id: 'sequence-flow-has-correct-condition-type',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SEQUENCE_FLOW)) {
        return;
      }

      const conditionType = get(node.$attrs, [CONDITION_TYPE_ATTR], '').trim();
      const sourceNode = node.sourceRef;

      if (!is(sourceNode, EXCLUSIVE_GATEWAY) && !is(sourceNode, INCLUSIVE_GATEWAY) && !!conditionType && conditionType !== 'NONE') {
        reporter.report(node.id, t('bpmn-linter.sequence-flow.has-correct-condition-type'));
      }
    };

    return {
      check
    };
  }
};

const sequenceFlowHasIncomingConditionalResult = {
  id: 'sequence-flow-has-incoming-conditional-result',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SEQUENCE_FLOW)) {
        return;
      }

      const sourceNode = node.sourceRef;
      if (!is(sourceNode, EXCLUSIVE_GATEWAY) && !is(sourceNode, INCLUSIVE_GATEWAY)) {
        return;
      }

      const conditionConfigAttr = `${PREFIX_FIELD}conditionConfig`;

      const conditionType = get(node.$attrs, [CONDITION_TYPE_ATTR], '').trim();
      const conditionConfig = JSON.parse(get(node.$attrs, [conditionConfigAttr], '{}'));
      const outcome = (conditionConfig.outcome || '').trim();

      if (conditionType === 'OUTCOME' && !outcome) {
        reporter.report(node.id, t('bpmn-linter.sequence-flow.no-incoming-conditional-result'));
      }
    };

    return {
      check
    };
  }
};

const sequenceFlowHasScript = {
  id: 'sequence-flow-has-script',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SEQUENCE_FLOW)) {
        return;
      }

      const sourceNode = node.sourceRef;
      if (!is(sourceNode, EXCLUSIVE_GATEWAY) && !is(sourceNode, INCLUSIVE_GATEWAY)) {
        return;
      }

      const conditionConfigAttr = `${PREFIX_FIELD}conditionConfig`;

      const conditionType = get(node.$attrs, [CONDITION_TYPE_ATTR], '').trim();
      const conditionConfig = JSON.parse(get(node.$attrs, [conditionConfigAttr], '{}'));
      const script = (conditionConfig.fn || '').trim();

      if (conditionType === 'SCRIPT' && !script) {
        reporter.report(node.id, t('bpmn-linter.sequence-flow.no-conditional-script'));
      }
    };

    return {
      check
    };
  }
};

const sequenceFlowHasExpression = {
  id: 'sequence-flow-has-expression',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SEQUENCE_FLOW)) {
        return;
      }

      const sourceNode = node.sourceRef;
      if (!is(sourceNode, EXCLUSIVE_GATEWAY) && !is(sourceNode, INCLUSIVE_GATEWAY)) {
        return;
      }

      const conditionConfigAttr = `${PREFIX_FIELD}conditionConfig`;

      const conditionType = get(node.$attrs, [CONDITION_TYPE_ATTR], '').trim();
      const conditionConfig = JSON.parse(get(node.$attrs, [conditionConfigAttr], '{}'));
      const expression = (conditionConfig.expression || '').trim();

      if (conditionType === 'EXPRESSION' && !expression) {
        reporter.report(node.id, t('bpmn-linter.sequence-flow.no-expression'));
      }
    };

    return {
      check
    };
  }
};

export const sequenceFlowRulesMap = {
  [sequenceFlowsFromGatewaysShouldBeDefault.id]: 'warn',
  [sequenceFlowsFromGatewaysAreCorrect.id]: 'error',
  [sequenceFlowHasCorrectConditionType.id]: 'error',
  [sequenceFlowHasIncomingConditionalResult.id]: 'error',
  [sequenceFlowHasScript.id]: 'error',
  [sequenceFlowHasExpression.id]: 'error'
};

export const sequenceFlowCacheMap = {
  [`${BPMN_LINT_PREFIX}${sequenceFlowsFromGatewaysShouldBeDefault.id}`]: sequenceFlowsFromGatewaysShouldBeDefault.callback,
  [`${BPMN_LINT_PREFIX}${sequenceFlowsFromGatewaysAreCorrect.id}`]: sequenceFlowsFromGatewaysAreCorrect.callback,
  [`${BPMN_LINT_PREFIX}${sequenceFlowHasCorrectConditionType.id}`]: sequenceFlowHasCorrectConditionType.callback,
  [`${BPMN_LINT_PREFIX}${sequenceFlowHasIncomingConditionalResult.id}`]: sequenceFlowHasIncomingConditionalResult.callback,
  [`${BPMN_LINT_PREFIX}${sequenceFlowHasScript.id}`]: sequenceFlowHasScript.callback,
  [`${BPMN_LINT_PREFIX}${sequenceFlowHasExpression.id}`]: sequenceFlowHasExpression.callback
};
