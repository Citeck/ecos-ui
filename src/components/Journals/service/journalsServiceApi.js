import Records from '../../Records/Records';

class JournalsServiceApi {
  async getJournalConfig(journalId) {
    return Records.get('uiserv/journal_v1@' + journalId)
      .load('.json')
      .then(resp => {
        const data = resp || { meta: {} };
        if (!data.columns || data.columns.length === 0) {
          console.error("Journal without columns! ID: '" + journalId + "'", resp);
        }
        return data;
      });
  }

  async queryData(query, attributes) {
    let result;
    if (!attributes) {
      result = Records.query(query);
    } else {
      result = Records.query(query, attributes);
    }
    return result.catch(e => {
      console.error(e);
      return {
        records: [],
        total: 0,
        attributes
      };
    });
  }

  async loadAttributes(record, attributes) {
    return Records.get(record).load(attributes);
  }
}

const INSTANCE = new JournalsServiceApi();
export default INSTANCE;
