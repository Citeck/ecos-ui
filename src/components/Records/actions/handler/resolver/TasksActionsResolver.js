import RecordActionsResolver from '../RecordActionsResolver';
import Records from '../../../Records';
import { t } from '../../../../../helpers/export/util';

export default class TasksActionsResolver extends RecordActionsResolver {
  static ACTION_ID = 'tasks-actions';

  async resolve(records, action, context) {
    let queryRes = await Records.query(
      {
        sourceId: 'uiserv/task-form',
        language: 'tasks',
        query: {
          recordRefs: records.map(r => r.id)
        }
      },
      '.json'
    );

    if (!queryRes || !queryRes.records || !queryRes.records.length) {
      return {};
    }

    let result = {};
    for (let recordInfo of queryRes.records) {
      let recordData = recordInfo['.json'] || {};

      let actions = [];
      for (let taskData of recordData.taskActions || []) {
        let outcomes = taskData.outcomes;

        let variants = [];

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
