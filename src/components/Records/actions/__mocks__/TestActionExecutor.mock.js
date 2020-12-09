import ActionsExecutor from '../handler/ActionsExecutor';

function callback(p, action, context) {
  return typeof action.callback === 'function' ? action.callback(p, action, context) : undefined;
}

export default class TestActionExecutor extends ActionsExecutor {
  static ACTION_ID = 'test-action';

  async execForRecord(record, action, context) {
    return callback(record, action, context);
  }

  async execForRecords(records, action, context) {
    return callback(records, action, context);
  }

  async execForQuery(query, action, context) {
    return callback(query, action, context);
  }

  getDefaultActionModel() {
    return {
      icon: 'test-icon',
      name: 'Custom test action'
    };
  }
}

export const TEST_ACTION_CONFIG = {
  type: TestActionExecutor.ACTION_ID
};
