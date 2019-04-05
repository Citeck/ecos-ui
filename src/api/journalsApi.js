import { RecordService } from './recordService';
import { PROXY_URI } from '../constants/alfresco';
import dataSourceStore from '../components/common/grid/dataSource/DataSourceStore';

export class JournalsApi extends RecordService {
  saveRecords = ({ id, attributes }) => {
    return this.mutate({ record: { id, attributes } });
  };

  deleteRecords = records => {
    return this.delete({ records: records });
  };

  getGridData = ({ columns, criteria, pagination, predicate, groupBy, sortBy }) => {
    const query = criteria => {
      let query = {};

      criteria.forEach((criterion, idx) => {
        query['field_' + idx] = criterion.field;
        query['predicate_' + idx] = criterion.predicate;
        query['value_' + idx] = criterion.value;
      });

      return JSON.stringify(query);
    };

    const dataSource = new dataSourceStore['GqlDataSource']({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: {
        body: {
          query: {
            query: criteria.length ? query(criteria) : predicate,
            language: criteria.length ? 'criteria' : 'predicate',
            page: pagination,
            groupBy,
            sortBy
          }
        }
      },
      columns: columns || []
    });

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns };
    });
  };

  getTreeGridData = () => {
    const dataSource = new dataSourceStore['TreeDataSource']();

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns, isTree: true };
    });
  };

  getGridDataUsePredicates = ({ columns, pagination, journalConfigPredicate, predicates }) => {
    const query = {
      t: 'and',
      val: [
        journalConfigPredicate,
        ...predicates.filter(item => {
          return item.val !== '' && item.val !== null;
        })
      ]
    };

    const dataSource = new dataSourceStore['GqlDataSource']({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: {
        body: {
          query: {
            query,
            language: 'predicate',
            page: pagination,
            consistency: 'EVENTUAL'
          }
        }
      },
      columns: columns || []
    });

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns };
    });
  };

  getJournalConfig = journalId => {
    return this.getJson(`${PROXY_URI}api/journals/config?journalId=${journalId}`).then(resp => {
      return resp || {};
    });
  };

  getJournalsList = () => {
    return this.getJson(`${PROXY_URI}api/journals/lists`).then(resp => {
      return resp.journalsLists || [];
    });
  };

  getJournals = () => {
    return this.getJson(`${PROXY_URI}api/journals/all`).then(resp => {
      return resp.journals || [];
    });
  };

  getJournalsByJournalsList = journalsListId => {
    return this.getJson(`${PROXY_URI}api/journals/list?journalsList=${journalsListId}`).then(resp => {
      return resp.journals || [];
    });
  };

  getDashletConfig = id => {
    return this.getJson(`${PROXY_URI}citeck/dashlet/config?key=${id}`).then(resp => {
      return resp;
    });
  };

  saveDashletConfig = (config, id) => {
    return this.postJson(`${PROXY_URI}citeck/dashlet/config?key=${id}`, config).then(resp => {
      return resp;
    });
  };

  saveJournalSettings = settings => {
    return this.putJson(
      `${PROXY_URI}116.203.142.178:8085/uiserv/api/journalprefs?journalViewPrefsId=contract-agreements-default`,
      settings
    ).then(resp => {
      return resp;
    });
  };
}
