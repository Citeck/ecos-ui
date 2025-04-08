import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { BPMN_LINT_PREFIX } from '../constants';

import { PREFIX_FIELD } from '@/constants/cmmn';
import { t } from '@/helpers/util';

const SERVICE_TASK = 'bpmn:ServiceTask';

const serviceTaskHasType = {
  id: 'service-task-no-type',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SERVICE_TASK)) {
        return;
      }

      const typeAttr = `${PREFIX_FIELD}serviceTaskType`;
      const type = get(node.$attrs, [typeAttr], '').trim();

      if (!type) {
        reporter.report(node.id, t('bpmn-linter.service-task.no-type'));
      }
    };

    return {
      check
    };
  }
};

const serviceTaskHasTopicExternalTask = {
  id: 'service-task-no-external-topic',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SERVICE_TASK)) {
        return;
      }

      const typeAttr = `${PREFIX_FIELD}serviceTaskType`;
      const externalTaskTopicAttr = `${PREFIX_FIELD}externalTaskTopic`;

      const type = get(node.$attrs, [typeAttr], '').trim();
      const externalTaskTopic = get(node.$attrs, [externalTaskTopicAttr], '').trim();

      if (type === 'EXTERNAL' && !externalTaskTopic) {
        reporter.report(node.id, t('bpmn-linter.service-task.no-topic-external-type'));
      }
    };

    return {
      check
    };
  }
};

const serviceTaskHasExpression = {
  id: 'service-task-no-expression',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SERVICE_TASK)) {
        return;
      }

      const typeAttr = `${PREFIX_FIELD}serviceTaskType`;
      const expressionAttr = `${PREFIX_FIELD}expression`;

      const type = get(node.$attrs, [typeAttr], '').trim();
      const expression = get(node.$attrs, [expressionAttr], '').trim();

      if (type === 'EXPRESSION' && !expression) {
        reporter.report(node.id, t('bpmn-linter.service-task.no-expression'));
      }
    };

    return {
      check
    };
  }
};

export const serviceTaskRulesMap = {
  [serviceTaskHasType.id]: 'error',
  [serviceTaskHasTopicExternalTask.id]: 'error',
  [serviceTaskHasExpression.id]: 'error'
};

export const serviceTaskCacheMap = {
  [`${BPMN_LINT_PREFIX}${serviceTaskHasType.id}`]: serviceTaskHasType.callback,
  [`${BPMN_LINT_PREFIX}${serviceTaskHasTopicExternalTask.id}`]: serviceTaskHasTopicExternalTask.callback,
  [`${BPMN_LINT_PREFIX}${serviceTaskHasExpression.id}`]: serviceTaskHasExpression.callback
};
