import { RecordService } from './recordService';
import dataSourceStore from '../components/common/grid/dataSource/DataSourceStore';
import { PROXY_URI } from '../constants/alfresco';

export class EventsHistoryApi extends RecordService {
  getEventsHistory = ({ record, columns = [], predicates = [], consistency = 'EVENTUAL', groupBy, sortBy }) => {
    const query = {
      query: {
        nodeRef: record,
        events:
          'node.created,node.updated,assoc.updated,task.complete,user.action,status.changed,esign.signed,approval.cancelled,role.changed'
        // t: 'and',
        // val: [].concat(
        //   predicates.filter(item => {
        //     return item.val !== '' && item.val !== null;
        //   })
        // )
      },
      sourceId: 'history',
      language: 'document',
      //consistency,
      groupBy,
      sortBy
    };

    const dataSource = new dataSourceStore['GqlDataSource']({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: { body: { query } },
      columns: columns || []
    });

    return dataSource
      .load()
      .then(({ data }) => ({ data, columns: dataSource.getColumns() }))
      .catch(() => ({ data: [], columns: [] }));
  };
}
