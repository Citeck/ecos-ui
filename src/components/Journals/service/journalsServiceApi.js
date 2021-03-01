import Records from '../../Records/Records';
import { SourcesId } from '../../../constants';

class JournalsServiceApi {
  async getJournalConfigByType(typeRef, attributes) {
    return Records.queryOne(
      {
        sourceId: 'uiserv/rjournal',
        query: { typeRef },
        language: 'by-type'
      },
      attributes
    );
  }

  async getJournalConfig(journalId) {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('.json');
  }

  async isNotExistsJournal(journalId) {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('_notExists');
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
