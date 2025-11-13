import get from 'lodash/get';
import merge from 'lodash/merge';

import { QueryLanguages, SourcesId } from '../../../../../constants';
import { t } from '../../../../../helpers/export/util';
import OpenTaskActions from '../../../../Records/actions/handler/executor/workflow/OpenTaskActions';
import Records from '../../../Records';
import RecordActionsResolver from '../RecordActionsResolver';
import TaskOutcomeAction from '../executor/workflow/TaskOutcomeAction';

const formatId = arr => arr.filter(d => d).join('-');

export default class TasksActionsResolver extends RecordActionsResolver {
  static ACTION_ID = 'tasks-actions';

  async resolve(records, action, context) {
    const result = {};

    const evalOutcomesForTasks = get(action, 'config.evalOutcomesForTasks');
    const isViewTaskInfoInModal = get(action, 'config.isViewTaskInfoInModal', false);
    const queryRes = await Records.query(
      {
        sourceId: SourcesId.TASK_FORM,
        language: QueryLanguages.TASKS,
        query: {
          recordRefs: records.map(r => r.id),
          ...(evalOutcomesForTasks ? { evalOutcomesForTasks } : {})
        }
      },
      '.json'
    );

    if (!get(queryRes, 'records.length')) {
      return result;
    }

    for (let recordInfo of queryRes.records) {
      const recordData = recordInfo['.json'] || {};
      const actions = [];

      for (let taskData of recordData.taskActions || []) {
        const outcomes = taskData.outcomes;
        const variants = [];

        for (let outcome of outcomes) {
          const _variant = {};

          merge(_variant, action);
          merge(_variant, {
            id: formatId(['task', taskData.taskRef, outcome.outcome]),
            name: outcome.label,
            type: TaskOutcomeAction.ACTION_ID,
            config: {
              ...outcome,
              taskRef: taskData.taskRef,
              formRef: taskData.formRef
            }
          });

          variants.push(_variant);
        }

        const _action = {};

        merge(_action, action);
        merge(_action, {
          id: formatId(['task', taskData.taskRef]),
          name: t('record-action.tasks-actions.task-name-prefix', { task: taskData.taskDisp }),
          type: TaskOutcomeAction.ACTION_ID,
          variants
        });

        if (!outcomes.length) {
          _action.isViewTaskInfoInModal = isViewTaskInfoInModal;
          _action.type = OpenTaskActions.ACTION_ID;
        }

        actions.push(_action);
      }

      result[recordData.recordRef] = actions;
    }

    return result;
  }
}
