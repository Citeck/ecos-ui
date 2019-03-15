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

  getGridData = ({ columns, criteria, pagination, createVariants }) => {
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
            query: query(criteria),
            language: 'criteria',
            page: pagination
          }
        }
      },
      columns: columns || [],
      createVariants: createVariants || []
    });

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns };
    });
  };

  getTreeGridData = () => {
    return this.query({
      query: {
        query: JSON.stringify({
          field_0: 'type',
          predicate_0: 'type-equals',
          value_0: '{http://www.citeck.ru/model/contracts/1.0}agreement'
        }),
        language: 'criteria',
        groupBy: ['contracts:contractWith']
      },
      attributes: {
        sum: 'sum(contracts:agreementAmount)',
        value: '.att(n:"predicate"){val:att(n:"value"){str}, att: att(n:"attribute"){str}}',
        children: '.att(n:"values"){atts(n:"records"){att(n:"cm:title"){str}}}'
      }
    }).then(resp => {
      console.log(resp);
      return resp;
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
