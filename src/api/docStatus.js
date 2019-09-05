import { RecordService } from './recordService';
import Records from '../components/Records';
import { SourcesId } from '../constants';

export class DocStatusApi extends RecordService {
  isUpdateDocStatus = function({ record }) {
    return Records.get(record)
      .load('pendingUpdate?bool', true)
      .then(res => res);
  };

  getDocStatus = ({ record }) => {
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
