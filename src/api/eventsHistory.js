import { RecordService } from './recordService';
import dataSourceStore from '../components/common/grid/dataSource/DataSourceStore';
import { PROXY_URI } from '../constants/alfresco';
import { Permissions, SourcesId } from '../constants';

export class EventsHistoryApi extends RecordService {
  getEventsHistory = ({ record, columns = [] }) => {
    const query = {
      query: {
        nodeRef: record,
        events:
          'node.created,node.updated,assoc.updated,task.complete,user.action,status.changed,esign.signed,approval.cancelled,role.changed'
      },
      sourceId: SourcesId.HISTORY,
      language: 'document'
    };

    const dataSource = new dataSourceStore['GqlDataSource']({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: { body: { query } },
      columns,
      permissions: [Permissions.Read]
    });

    return dataSource
      .load()
      .then(({ data }) => ({ data, columns: dataSource.getColumns() }))
      .catch(() => ({ data: [], columns: [] }));
  };
}
