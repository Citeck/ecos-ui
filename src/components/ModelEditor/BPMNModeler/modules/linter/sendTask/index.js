import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { BPMN_LINT_PREFIX } from '../constants';

import { PREFIX_FIELD } from '@/constants/cmmn';
import { t } from '@/helpers/util';

const SEND_TASK = 'bpmn:SendTask';

const parseArray = (node, att) => JSON.parse(get(node.$attrs, [att], '[]')).filter((item) => item.trim());

const sendTaskHasNotificationType = {
  id: 'send-task-no-notification-type',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SEND_TASK)) {
        return;
      }

      const notificationTypeAttr = `${PREFIX_FIELD}notificationType`;
      const notificationType = get(node.$attrs, [notificationTypeAttr], '').trim();

      if (!notificationType) {
        reporter.report(node.id, t('bpmn-linter.send-task.no-notification-type'));
      }
    };

    return {
      check,
    };
  },
};

const sendTaskHasMessage = {
  id: 'send-task-no-message',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SEND_TASK)) {
        return;
      }

      const templateAttr = `${PREFIX_FIELD}notificationTemplate`;
      const bodyAttr = `${PREFIX_FIELD}notificationBody`;
      const template = get(node.$attrs, [templateAttr], '').trim();
      const body = get(node.$attrs, [bodyAttr], '').trim();

      if (!template && !body) {
        reporter.report(node.id, t('bpmn-linter.send-task.no-message'));
      }
    };

    return {
      check,
    };
  },
};

const sendTaskHasRecipients = {
  id: 'send-task-no-recipients',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SEND_TASK)) {
        return;
      }

      const notificationToExpressionAttr = `${PREFIX_FIELD}notificationToExpression`;
      const notificationCcExpressionAttr = `${PREFIX_FIELD}notificationCcExpression`;
      const notificationBccExpressionAttr = `${PREFIX_FIELD}notificationBccExpression`;

      const notificationToAttr = `${PREFIX_FIELD}notificationTo`;
      const notificationBccAttr = `${PREFIX_FIELD}notificationBcc`;
      const notificationCcAttr = `${PREFIX_FIELD}notificationCc`;

      const notificationToExpression = parseArray(node, notificationToExpressionAttr);
      const notificationCcExpression = parseArray(node, notificationCcExpressionAttr);
      const notificationBccExpression = parseArray(node, notificationBccExpressionAttr);

      const notificationTo = parseArray(node, notificationToAttr);
      const notificationCc = parseArray(node, notificationBccAttr);
      const notificationBcc = parseArray(node, notificationCcAttr);

      const hasExpressionRecs = notificationToExpression.length || notificationCcExpression.length || notificationBccExpression.length;

      const hasRoleRecs = notificationTo.length || notificationCc.length || notificationBcc.length;

      if (!hasExpressionRecs && !hasRoleRecs) {
        reporter.report(node.id, t('bpmn-linter.send-task.no-recipients'));
      }
    };

    return {
      check,
    };
  },
};

export const sendTaskRulesMap = {
  [sendTaskHasNotificationType.id]: 'error',
  [sendTaskHasMessage.id]: 'error',
  [sendTaskHasRecipients.id]: 'error',
};

export const sendTaskCacheMap = {
  [`${BPMN_LINT_PREFIX}${sendTaskHasNotificationType.id}`]: sendTaskHasNotificationType.callback,
  [`${BPMN_LINT_PREFIX}${sendTaskHasMessage.id}`]: sendTaskHasMessage.callback,
  [`${BPMN_LINT_PREFIX}${sendTaskHasRecipients.id}`]: sendTaskHasRecipients.callback,
};
