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

  setDocStatus = async ({ record, status }) => {
    const rec = Records.getRecordToEdit(record);
    rec.att('_status', status);
    await rec.save();
  };

  getAvailableToChangeStatuses = async ({ record }) => {
    if (record.indexOf('workspace://') !== -1) {
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
    }

    const { canWrite, status, typeRef } = await Records.get(record).load({
      canWrite: 'permissions._has.Write?bool!false',
      status: '_status?str',
      typeRef: '_type?id'
    });

    if (!canWrite || !typeRef) {
      return { records: [] };
    }

    const resolvedTypeRef = typeRef.replace(`${SourcesId.TYPE}@`, `${SourcesId.RESOLVED_TYPE}@`);
    const typeStatuses = await Records.get(resolvedTypeRef).load('model.statuses[]{id,name}');

    if (!Array.isArray(typeStatuses)) {
      return { records: [] };
    }

    const available = typeStatuses
      .filter(s => s.id !== status)
      .map(s => ({ id: s.id, name: s.name }));

    return { records: available };
  };
}
