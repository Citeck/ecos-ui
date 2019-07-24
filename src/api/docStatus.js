import { RecordService } from './recordService';
import Records from '../components/Records';

export class DocStatusApi extends RecordService {
  isUpdateDocStatus = function({ record }) {
    return Records.get(record)
      .load('pendingUpdate?bool', true)
      .then(res => res);
  };

  getDocStatus = ({ record }) => {
    return Records.query(
      {
        sourceId: 'status',
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
    return Records.query(
      {
        sourceId: 'status',
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
