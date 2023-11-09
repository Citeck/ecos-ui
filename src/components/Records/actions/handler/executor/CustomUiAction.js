import ActionsExecutor from '../ActionsExecutor';
import MigrateTokenAction from './MigrateTokenAction/index';

export default class CustomUiAction extends ActionsExecutor {
  static ACTION_ID = 'customUiAction';

  async execForRecord(record, action, context) {
    const { config = {} } = action || {};
    const { actionId } = config;

    switch (actionId) {
      case MigrateTokenAction.ACTION_ID:
        const migrationAction = new MigrateTokenAction();
        return migrationAction.execForRecord(record, action, context);
      default:
        return null;
    }
  }
}
