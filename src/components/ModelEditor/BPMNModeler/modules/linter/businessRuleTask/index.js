import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { BPMN_LINT_PREFIX } from '../constants';

import { PREFIX_FIELD } from '@/constants/cmmn';
import { t } from '@/helpers/util';

const BUSINESS_RULE_TASK = 'bpmn:BusinessRuleTask';

const businessRuleTaskHasSolution = {
  id: 'business-rule-task-no-solution',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, BUSINESS_RULE_TASK)) {
        return;
      }

      const decisionRefAttr = `${PREFIX_FIELD}decisionRef`;
      const decisionRef = get(node.$attrs, [decisionRefAttr], '').trim();

      if (!decisionRef) {
        reporter.report(node.id, t('bpmn-linter.business-rule-task.no-solution'));
      }
    };

    return {
      check,
    };
  },
};

const businessRuleTaskHasConnection = {
  id: 'business-rule-task-no-connection',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, BUSINESS_RULE_TASK)) {
        return;
      }

      const decisionBindingAttr = `${PREFIX_FIELD}decisionBinding`;
      const decisionBinding = get(node.$attrs, [decisionBindingAttr], '').trim();

      if (!decisionBinding) {
        reporter.report(node.id, t('bpmn-linter.business-rule-task.no-connection'));
      }
    };

    return {
      check,
    };
  },
};

const businessRuleTaskHasVersionTag = {
  id: 'business-rule-task-no-version-tag',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, BUSINESS_RULE_TASK)) {
        return;
      }

      const decisionBindingAttr = `${PREFIX_FIELD}decisionBinding`;
      const decisionVersionTagAttr = `${PREFIX_FIELD}decisionVersionTag`;

      const decisionBinding = get(node.$attrs, [decisionBindingAttr], '').trim();
      const decisionVersionTag = get(node.$attrs, [decisionVersionTagAttr], '').trim();

      if (decisionBinding === 'VERSION_TAG' && !decisionVersionTag) {
        reporter.report(node.id, t('bpmn-linter.business-rule-task.no-version-tag'));
      }
    };

    return {
      check,
    };
  },
};

const businessRuleTaskHasVersion = {
  id: 'business-rule-task-no-version',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, BUSINESS_RULE_TASK)) {
        return;
      }

      const decisionBindingAttr = `${PREFIX_FIELD}decisionBinding`;
      const decisionVersionAttr = `${PREFIX_FIELD}decisionVersion`;

      const decisionBinding = get(node.$attrs, [decisionBindingAttr], '').trim();
      const decisionVersion = get(node.$attrs, [decisionVersionAttr], '').trim();

      if (decisionBinding === 'VERSION' && !decisionVersion) {
        reporter.report(node.id, t('bpmn-linter.business-rule-task.no-version'));
      }
    };

    return {
      check,
    };
  },
};

export const businessRuleTaskRulesMap = {
  [businessRuleTaskHasSolution.id]: 'error',
  [businessRuleTaskHasConnection.id]: 'error',
  [businessRuleTaskHasVersionTag.id]: 'error',
  [businessRuleTaskHasVersion.id]: 'error',
};

export const businessRuleTaskCacheMap = {
  [`${BPMN_LINT_PREFIX}${businessRuleTaskHasSolution.id}`]: businessRuleTaskHasSolution.callback,
  [`${BPMN_LINT_PREFIX}${businessRuleTaskHasConnection.id}`]: businessRuleTaskHasConnection.callback,
  [`${BPMN_LINT_PREFIX}${businessRuleTaskHasVersionTag.id}`]: businessRuleTaskHasVersionTag.callback,
  [`${BPMN_LINT_PREFIX}${businessRuleTaskHasVersion.id}`]: businessRuleTaskHasVersion.callback,
};
