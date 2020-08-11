import ActionsHandler from './ActionsHandler';

/**
 * Abstract class to implement actions resolver.
 *
 * Actions resolver gets one action config and return list of others.
 */
export default class RecordActionsResolver extends ActionsHandler {
  /**
   * @param {Array<Record>} records
   * @param {RecordAction} action
   * @param {object} context
   * @returns {Promise<Object<String,Array<RecordAction>>>}
   */
  async resolve(records, action, context) {
    return {};
  }
}
