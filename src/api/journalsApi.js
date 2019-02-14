import { RecordService } from './recordService';
import { PROXY_URI } from '../constants/alfresco';
import dataSourceStore from '../components/common/grid/dataSource/DataSourceStore';

export class JournalsApi extends RecordService {
  getGridData = options => {
    const query = criteria => {
      let query = {};

      (criteria || []).forEach((criterion, idx) => {
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
            query: query(options.meta.criteria),
            language: 'criteria',
            page: options.page || {
              skipCount: 0,
              maxItems: 10
            }
          }
        }
      },
      columns: options.columns
    });

    const columns = dataSource.getColumns();

    return dataSource.load().then(function({ data, total }) {
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
}
