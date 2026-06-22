import { Permissions, SourcesId } from '@citeck/constants';
import { PROXY_URI } from '@citeck/constants/alfresco';

import GqlDataSource from '../components/common/grid/dataSource/GqlDataSource';

import { RecordService } from './recordService';

export class EventsHistoryApi extends RecordService {
  /**
   * @deprecated journal service is used to get records
   */
  getEventsHistory = ({ record, columns = [] }) => {
    const query = {
      query: {
        nodeRef: record,
        events:
          'node.created,node.updated,assoc.updated,task.complete,user.action,email.sent,status.changed,esign.signed,approval.cancelled,role.changed'
      },
      sourceId: SourcesId.HISTORY,
      language: 'document'
    };

    const dataSource = new GqlDataSource({
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
