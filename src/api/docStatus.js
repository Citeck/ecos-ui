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
    return {
      records: [
        {
          name: 'Согласование',
          type: 'case-status',
          id: 'status@approval'
        },
        {
          name: 'Черновик',
          type: 'case-status',
          id: 'status@draft'
        },
        {
          name: 'На подписании',
          type: 'case-status',
          id: 'status@signing'
        }
      ],
      hasMore: false,
      totalCount: 3
    };
    // return Records.query(
    //   {
    //     sourceId: SourcesId.STATUS,
    //     query: {
    //       allAvailableToChange: record
    //     }
    //   },
    //   {
    //     name: 'name',
    //     type: 'type'
    //   }
    // ).then(res => res);
  };
}
