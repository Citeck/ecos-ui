import ActionsHandler from './ActionsHandler';

/**
 * Abstract class to implement actions resolver.
 *
 * Actions resolver gets one action config and return list of others.
 */
export default class ActionsResolver extends ActionsHandler {
  /**
   * @param {RecordAction} action
   * @param {object} context
   * @returns {Array<RecordAction>}
   */
  async resolve(action, context) {
    return [];
  }
}
