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

  async getJournalConfig(journalId, force) {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('.json', force);
  }

  async isNotExistsJournal(journalId) {
    let id = journalId;

    if (id.indexOf(SourcesId.RESOLVED_JOURNAL) !== -1) {
      id = id.slice(id.indexOf(SourcesId.RESOLVED_JOURNAL) + SourcesId.RESOLVED_JOURNAL.length + 1);
    }

    if (id.indexOf(SourcesId.JOURNAL) === -1) {
      id = `${SourcesId.JOURNAL}@${id}`;
    }

    return Records.get(id).load('_notExists?bool');
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
