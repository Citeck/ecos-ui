import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { PREFIX_FIELD } from '../../../../../../constants/cmmn';
import { t } from '../../../../../../helpers/util';
import { BPMN_LINT_PREFIX } from '../constants';

const SCRIPT_TASK = 'bpmn:ScriptTask';

const scriptTaskHasScript = {
  id: 'script-task-no-script',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, SCRIPT_TASK)) {
        return;
      }

      const scriptAttr = `${PREFIX_FIELD}script`;
      const script = get(node.$attrs, [scriptAttr], '').trim();

      if (!script) {
        reporter.report(node.id, t('bpmn-linter.script-task.no-script'));
      }
    };

    return {
      check
    };
  }
};

export const scriptTaskRulesMap = {
  [scriptTaskHasScript.id]: 'error'
};

export const scriptTaskCacheMap = {
  [`${BPMN_LINT_PREFIX}${scriptTaskHasScript.id}`]: scriptTaskHasScript.callback
};
