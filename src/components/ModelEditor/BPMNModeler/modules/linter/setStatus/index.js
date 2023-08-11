import { is } from 'bpmn-js/lib/util/ModelUtil';

import { ECOS_TASK_TYPE_SET_STATUS } from '../../../../../../constants/bpmn';
import { t } from '../../../../../../helpers/util';
import { BPMN_LINT_PREFIX } from '../constants';

const SET_STATUS_TASK = 'bpmn:Task';

const setStatusTaskHasStatus = {
  id: 'set-status-no-status',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SET_STATUS_TASK) || node.taskType !== ECOS_TASK_TYPE_SET_STATUS) {
        return;
      }

      if (!node.status) {
        reporter.report(node.id, t('bpmn-linter.set-status.no-status'));
      }
    };

    return {
      check
    };
  }
};

export const setStatusRulesMap = {
  [setStatusTaskHasStatus.id]: 'error'
};

export const setStatusCacheMap = {
  [`${BPMN_LINT_PREFIX}${setStatusTaskHasStatus.id}`]: setStatusTaskHasStatus.callback
};
