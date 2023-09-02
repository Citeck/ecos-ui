import ActionsExecutor from '../../ActionsExecutor';
import { createUserActionNode } from '../../../export/recordActions';

export default class CaseCreateNodeAction extends ActionsExecutor {
  static ACTION_ID = 'CREATE_NODE';

  async execForRecord(record, action, context) {
    return createUserActionNode(action.config, undefined, { options: { actionRecord: record.id } });
  }

  getDefaultActionModel() {
    return {
      icon: 'icon-small-arrow-right'
    };
  }
}
