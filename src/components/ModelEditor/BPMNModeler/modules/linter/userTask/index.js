import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { PREFIX_FIELD } from '../../../../../../constants/cmmn';
import { t } from '../../../../../../helpers/util';
import { BPMN_LINT_PREFIX } from '../constants';

const USER_TASK = 'bpmn:UserTask';

const userTaskHasRecipients = {
  id: 'user-task-no-recipients',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, USER_TASK)) {
        return;
      }

      const isManualRecipientsMode = JSON.parse(get(node.$attrs, [`${PREFIX_FIELD}manualRecipientsMode`], 'false'));
      const manualRecipientsAttr = `${PREFIX_FIELD}manualRecipients`;
      const autoRecipientsAttr = `${PREFIX_FIELD}assignees`;
      const recipients = JSON.parse(get(node.$attrs, [isManualRecipientsMode ? manualRecipientsAttr : autoRecipientsAttr], '[]'));
      const notEmptyRecipients = recipients.filter(recipient => recipient.trim());

      if (!notEmptyRecipients.length) {
        reporter.report(node.id, t('bpmn-linter.user-task.no-recipients'));
      }
    };

    return {
      check
    };
  }
};

const userTaskHasPriority = {
  id: 'user-task-no-priority',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, USER_TASK)) {
        return;
      }

      const priorityAttr = `${PREFIX_FIELD}priority`;
      const priorityExprAttr = `${PREFIX_FIELD}priorityExpression`;
      const priority = get(node.$attrs, [priorityAttr], '').trim();
      const priorityExpr = get(node.$attrs, [priorityExprAttr], '').trim();

      if (!priority && !priorityExpr) {
        reporter.report(node.id, t('bpmn-linter.user-task.no-priority'));
      }
    };

    return {
      check
    };
  }
};

export const userTaskRulesMap = {
  [userTaskHasRecipients.id]: 'error',
  [userTaskHasPriority.id]: 'error'
};

export const userTaskCacheMap = {
  [`${BPMN_LINT_PREFIX}${userTaskHasRecipients.id}`]: userTaskHasRecipients.callback,
  [`${BPMN_LINT_PREFIX}${userTaskHasPriority.id}`]: userTaskHasPriority.callback
};
