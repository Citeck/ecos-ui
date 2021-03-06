import ActionsHandler from './ActionsHandler';

/**
 * Abstract class to implement custom actions.
 */
export default class ActionsExecutor extends ActionsHandler {
  /**
   * Execute action for record.
   *
   * @param {Record} record
   * @param {RecordAction} action
   * @param {object} context
   * @returns {Promise<RecordsActionResult>}
   */
  async execForRecord(record, action, context) {
    throw new Error('Not implemented');
  }

  /**
   * Execute an action for records array.
   *
   * @param {Array<Record>} records
   * @param {RecordAction} action
   * @param {object} context
   * @returns {Promise<RecordsActionResult>}
   */
  async execForRecords(records, action, context) {
    throw new Error('Not implemented');
  }

  /**
   * Execute an action for records which can be found by a query.
   * Usually this action should be executed on a server.
   *
   * @param {RecordsQuery} query
   * @param {RecordAction} action
   * @param {object} context
   * @returns {Promise<RecordsActionResult>}
   */
  async execForQuery(query, action, context) {
    throw new Error('Not implemented');
  }

  /**
   * Update records
   *
   * @param {Record|Array<Record>} records
   *
   * @deprecated ActionsExecutor should not has method like this
   */
  updateRecords(records) {
    if (Array.isArray(records)) {
      records.forEach(record => record.update());
    } else {
      records.update();
    }
  }

  /**
   * @param {RecordAction} action
   * @return {boolean} true if service should check action by server before execution
   */
  isActionConfigCheckingRequired(action) {
    return true;
  }
}
