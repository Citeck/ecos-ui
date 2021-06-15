import { RecordService } from './recordService';
import Records from '../components/Records';
import { SourcesId } from '../constants';

export class DocStatusApi extends RecordService {
  getDocStatus = async ({ record }) => {
    if (record.indexOf('workspace://') === -1) {
      let statusData = await Records.get(record).load({
        status: '_status?str',
        typeRef: '_type?id'
      });
      if (statusData.status && statusData.typeRef) {
        let resolvedTypeRef = statusData.typeRef.replace(`${SourcesId.TYPE}@`, `${SourcesId.RESOLVED_TYPE}@`);
        let typeStatuses = await Records.get(resolvedTypeRef).load('model.statuses[]{id,name}');
        for (let status of typeStatuses || []) {
          if (status.id === statusData.status) {
            return {
              records: [{ id: status.id, name: status.name }]
            };
          }
        }
      }
      return { records: [] };
    }
    return Records.query(
      {
        sourceId: SourcesId.STATUS,
        query: {
          record
        }
      },
      {
        name: 'name',
        type: 'type'
      }
    ).then(res => res);
  };

  setDocStatus = ({ record, ...data }) => {
    return {};
  };

  getAvailableToChangeStatuses = ({ record }) => {
    if (record.indexOf('workspace://') === -1) {
      return { records: [] };
    }
    return Records.query(
      {
        sourceId: SourcesId.STATUS,
        query: {
          allAvailableToChange: record
        }
      },
      {
        name: 'name',
        type: 'type'
      }
    ).then(res => res);
  };
}
