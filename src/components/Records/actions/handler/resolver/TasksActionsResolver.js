import get from 'lodash/get';

import { t } from '../../../../../helpers/export/util';
import { QueryLanguages, SourcesId } from '../../../../../constants';
import Records from '../../../Records';
import RecordActionsResolver from '../RecordActionsResolver';

export default class TasksActionsResolver extends RecordActionsResolver {
  static ACTION_ID = 'tasks-actions';

  async resolve(records, action, context) {
    const result = {};
    const queryRes = await Records.query(
      {
        sourceId: SourcesId.TASK_FORM,
        language: QueryLanguages.TASKS,
        query: {
          recordRefs: records.map(r => r.id)
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
          variants.push({
            id: 'task-' + taskData.taskRef + '-' + outcome.outcome,
            name: outcome.label,
            config: {
              ...outcome,
              taskRef: taskData.taskRef,
              formRef: taskData.formRef
            }
          });
        }

        actions.push({
          id: 'task-' + taskData.taskRef,
          name: t('record-action.tasks-actions.task-name-prefix') + taskData.taskDisp,
          type: 'task-outcome',
          variants
        });
      }

      result[recordData.recordRef] = actions;
    }

    return result;
  }
}
