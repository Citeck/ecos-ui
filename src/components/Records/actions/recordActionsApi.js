import Records from '../Records';

const ACTION_INNER_ATTRIBUTES = 'id,name,pluralName:pluralName,icon,type,features:features?json,config:config?json';

/**
 * @typedef ForRecordsApiRes
 * @property {Array<number>} records
 * @property {Array<RecordAction>} actions
 */
class RecordActionsApi {
  /**
   *
   * @param {Array<string>} recordRefs
   * @param {Array<string>} actionRefs
   *
   * @return {ForRecordsApiRes}
   */
  async getActionsForRecords(recordRefs, actionRefs) {
    let result = null;
    try {
      result = await Records.queryOne(
        {
          sourceId: 'uiserv/record-actions',
          query: {
            records: recordRefs,
            actions: actionRefs
          }
        },
        {
          records: 'records[]?num',
          actions: `actions[]{${ACTION_INNER_ATTRIBUTES}}`
        }
      );
    } catch (e) {
      console.error('Exception while type actions was loaded', recordRefs, actionRefs, e);
    }
    if (!result) {
      result = {};
    }
    return {
      records: result['records'] || new Array(recordRefs.length).fill(0),
      actions: result['actions'] || []
    };
  }

  /**
   * @return {Promise<Array<string>>}
   */
  async getActionsForRecord(recordRef) {
    let typeRef = '';
    try {
      typeRef = await Records.get(recordRef).load('_type?id');
    } catch (e) {
      console.error(`Exception while getActionsForRecord. RecordRef: ${recordRef}`, e);
    }
    if (!typeRef) {
      return [];
    }
    return this.getActionsByType(typeRef);
  }

  /**
   * @return {Promise<Array<string>>}
   */
  async getActionsByType(typeRef) {
    if (!typeRef) {
      return [];
    }
    let result = null;
    try {
      result = await Records.get(typeRef).load(`_actions[]?id`);
    } catch (e) {
      console.error(`Exception while type actions was loaded. TypeRef: ${typeRef}`, e);
    }
    return result || [];
  }
}

export default new RecordActionsApi();
