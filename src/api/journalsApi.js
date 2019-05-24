import { RecordService } from './recordService';
import { PROXY_URI, MICRO_URI } from '../constants/alfresco';
import dataSourceStore from '../components/common/grid/dataSource/DataSourceStore';

export class JournalsApi extends RecordService {
  saveRecords = ({ id, attributes }) => {
    return this.mutate({ record: { id, attributes } });
  };

  deleteRecords = records => {
    return this.delete({ records: records });
  };

  getGridData = ({ columns, pagination, predicate, groupBy, sortBy, predicates = [] }) => {
    const query = {
      t: 'and',
      val: [
        predicate,
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
            query: query,
            language: 'predicate',
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
    //return this.getJson(`${MICRO_URI}api/journalcfg?journalId=contract-agreements`).then(resp => {
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

  getJournalSettings = journalType => {
    return this.getJson(`${MICRO_URI}api/journalprefs/list?journalId=${journalType}`).then(resp => {
      return resp;
    });
  };

  getJournalSetting = id => {
    return this.getJson(`${MICRO_URI}api/journalprefs?id=${id}`)
      .then(resp => {
        return resp;
      })
      .catch(() => {
        return null;
      });
  };

  saveJournalSetting = ({ id, settings }) => {
    return this.putJson(`${MICRO_URI}api/journalprefs?id=${id}`, settings, true).then(resp => {
      return resp;
    });
  };

  createJournalSetting = ({ journalId, settings }) => {
    return this.postJson(`${MICRO_URI}api/journalprefs?journalId=${journalId}`, settings, true).then(resp => {
      return resp;
    });
  };

  deleteJournalSetting = id => {
    return this.deleteJson(`${MICRO_URI}api/journalprefs/id/${id}`, true).then(resp => {
      return resp;
    });
  };

  getNodeContent = nodeRef => {
    return this.getJson(`${PROXY_URI}citeck/node-content?nodeRef=${nodeRef}`).then(resp => {
      return resp;
    });
  };
}
