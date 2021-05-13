import RecordActionsResolver from '../RecordActionsResolver';
import Records from '../../../Records';

const ACTION_ATTS_TO_LOAD = [
  'id',
  'name',
  'icon',
  'confirm:confirm?json',
  'type',
  'result:result?json',
  'config:config?json',
  'features:features?json'
];

export default class AttributeActionsResolver extends RecordActionsResolver {
  static ACTION_ID = 'attribute-actions';

  async resolve(records, action, context) {
    const {
      config: { attribute = '_actions' }
    } = action;
    const actions = await Records.get(records).load(attribute + '[]{' + ACTION_ATTS_TO_LOAD.join(',') + '}', true);
    if (actions) {
      let result = {};
      for (let i = 0; i < actions.length; i++) {
        result[records[i].id] = actions[i];
      }
      return result;
    }
    return {};
  }

  getAliases() {
    return ['record-actions'];
  }
}
