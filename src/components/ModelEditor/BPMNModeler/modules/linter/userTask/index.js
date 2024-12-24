import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { PREFIX_FIELD } from '../../../../../../constants/cmmn';
import { t } from '../../../../../../helpers/util';
import { BPMN_LINT_PREFIX } from '../constants';

const USER_TASK = 'bpmn:UserTask';

const ATT_DUE_DATE_MANUAL = `${PREFIX_FIELD}dueDateManual`;
const ATT_DUE_DATE_EXPRESSION = `${PREFIX_FIELD}dueDate`;

const ATT_DURATION = 'duration';
const ATT_WORKING_DAYS = 'workingDays';
const ATT_WORKING_SCHEDULE = 'workingSchedule';

const ATT_DURATION_TYPE = 'durationType';
const DURATION_TYPE_CALENDAR = 'CALENDAR';
const DURATION_TYPE_BUSINESS = 'BUSINESS';

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

const userTaskManualDueDateCalendarTimeNoDuration = {
  id: 'user-task-manual-due-date-calendar-time-no-duration',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, USER_TASK)) {
        return;
      }

      const dueDateManualMeta = JSON.parse(get(node.$attrs, [ATT_DUE_DATE_MANUAL], '{}').trim());
      const duration = get(dueDateManualMeta, [ATT_DURATION], '').trim();
      const durationType = get(dueDateManualMeta, [ATT_DURATION_TYPE], '').trim();

      if (durationType === DURATION_TYPE_CALENDAR && !duration) {
        reporter.report(node.id, t('bpmn-linter.user-task.duration.manual-calendar-no-duration'));
      }
    };

    return {
      check
    };
  }
};

const userTaskManualDueDateBusinessTimeNoDuration = {
  id: 'user-task-manual-due-date-business-time-no-one-duration',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, USER_TASK)) {
        return;
      }

      const dueDateManualMeta = JSON.parse(get(node.$attrs, [ATT_DUE_DATE_MANUAL], '{}').trim());
      const duration = get(dueDateManualMeta, [ATT_DURATION], '').trim();
      const workingDays = get(dueDateManualMeta, [ATT_WORKING_DAYS], '');
      const durationType = get(dueDateManualMeta, [ATT_DURATION_TYPE], '').trim();

      // should be selected workingDays or duration
      if (durationType === DURATION_TYPE_BUSINESS && (!duration && !workingDays)) {
        reporter.report(node.id, t('bpmn-linter.user-task.duration.manual-business-no-one-duration'));
      }
    };

    return {
      check
    };
  }
};

const userTaskManualDueDateBusinessTimeNoSchedule = {
  id: 'user-task-manual-due-date-business-time-no-schedule',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, USER_TASK)) {
        return;
      }

      const dueDateManualMeta = JSON.parse(get(node.$attrs, [ATT_DUE_DATE_MANUAL], '{}').trim());
      const schedule = get(dueDateManualMeta, [ATT_WORKING_SCHEDULE], '').trim();
      const durationType = get(dueDateManualMeta, [ATT_DURATION_TYPE], '').trim();

      if (durationType === DURATION_TYPE_BUSINESS && !schedule) {
        reporter.report(node.id, t('bpmn-linter.user-task.duration.manual-business-no-schedule'));
      }
    };

    return {
      check
    };
  }
};

const userTaskDueDateSelectedExpressionAndManualAtSameTime = {
  id: 'user-task-due-date-selected-expression-and-manual-at-same-time',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, USER_TASK)) {
        return;
      }

      const dueDateExpression = get(node.$attrs, [ATT_DUE_DATE_EXPRESSION], '').trim();
      const dueDateManualMeta = JSON.parse(get(node.$attrs, [ATT_DUE_DATE_MANUAL], '{}').trim());
      const durationType = get(dueDateManualMeta, [ATT_DURATION_TYPE], '').trim();

      if (dueDateExpression && !!durationType) {
        reporter.report(node.id, t('bpmn-linter.user-task.due-date.selected-expression-and-manual-at-same-time'));
      }
    };

    return {
      check
    };
  }
};

export const userTaskRulesMap = {
  [userTaskHasRecipients.id]: 'error',
  [userTaskHasPriority.id]: 'error',
  [userTaskManualDueDateCalendarTimeNoDuration.id]: 'error',
  [userTaskManualDueDateBusinessTimeNoDuration.id]: 'error',
  [userTaskManualDueDateBusinessTimeNoSchedule.id]: 'error',
  [userTaskDueDateSelectedExpressionAndManualAtSameTime.id]: 'warn'
};

export const userTaskCacheMap = {
  [`${BPMN_LINT_PREFIX}${userTaskHasRecipients.id}`]: userTaskHasRecipients.callback,
  [`${BPMN_LINT_PREFIX}${userTaskHasPriority.id}`]: userTaskHasPriority.callback,
  [`${BPMN_LINT_PREFIX}${userTaskManualDueDateCalendarTimeNoDuration.id}`]: userTaskManualDueDateCalendarTimeNoDuration.callback,
  [`${BPMN_LINT_PREFIX}${userTaskManualDueDateBusinessTimeNoDuration.id}`]: userTaskManualDueDateBusinessTimeNoDuration.callback,
  [`${BPMN_LINT_PREFIX}${userTaskManualDueDateBusinessTimeNoSchedule.id}`]: userTaskManualDueDateBusinessTimeNoSchedule.callback,
  [`${BPMN_LINT_PREFIX}${
    userTaskDueDateSelectedExpressionAndManualAtSameTime.id
  }`]: userTaskDueDateSelectedExpressionAndManualAtSameTime.callback
};
