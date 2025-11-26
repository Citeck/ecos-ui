import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { BPMN_LINT_PREFIX } from '../constants';

import { ECOS_TASK_TYPE_AI_TASK } from '@/constants/bpmn';
import { t } from '@/helpers/util';
import aiAssistantService from '@/components/AIAssistant/AIAssistantService';

const AI_TASK = 'bpmn:Task';

const aiTaskHasUserInput = {
  id: 'ai-task-no-user-input',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, AI_TASK) || node.taskType !== ECOS_TASK_TYPE_AI_TASK) {
        return;
      }

      const aiUserInput = get(node, 'aiUserInput', '').trim();

      if (!aiUserInput) {
        reporter.report(node.id, t('bpmn-linter.ai-task.no-user-input'));
      }
    };

    return {
      check
    };
  }
};

const aiTaskRequiresAssistantAvailable = {
  id: 'ai-task-requires-assistant-available',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, AI_TASK) || node.taskType !== ECOS_TASK_TYPE_AI_TASK) {
        return;
      }

      // Use cached availability check from AIAssistantService
      if (aiAssistantService.availabilityChecked && !aiAssistantService.availabilityCache) {
        reporter.report(node.id, t('bpmn-linter.ai-task.unavailable'));
      }
    };

    return {
      check
    };
  }
};

export const aiTaskRulesMap = {
  [aiTaskHasUserInput.id]: 'error',
  [aiTaskRequiresAssistantAvailable.id]: 'warn'
};

export const aiTaskCacheMap = {
  [`${BPMN_LINT_PREFIX}${aiTaskHasUserInput.id}`]: aiTaskHasUserInput.callback,
  [`${BPMN_LINT_PREFIX}${aiTaskRequiresAssistantAvailable.id}`]: aiTaskRequiresAssistantAvailable.callback
};
