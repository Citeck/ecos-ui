import RecordActionsResolver from '../RecordActionsResolver';
import Records from '../../../Records';

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

        for (let outcome of outcomes) {
          actions.push({
            id: 'task-' + taskData.taskRef + '-' + outcome.outcome,
            name: outcome.label,
            type: 'task-outcome',
            config: {
              ...outcome,
              taskRef: taskData.taskRef,
              formRef: taskData.formRef
            }
          });
        }
      }

      result[recordData.recordRef] = actions;
    }

    return result;
  }
}
