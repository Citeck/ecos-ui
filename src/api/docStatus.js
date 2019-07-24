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

  getAvailableStatuses = ({ record }) => {
    return { records: [] };
    //todo: no api

    // return {
    //   records: [
    //     {
    //       name: 'Согласование',
    //       type: 'case-status',
    //       id: 'status@approval'
    //     },
    //     {
    //       name: 'Черновик',
    //       type: 'case-status',
    //       id: 'status@draft'
    //     },
    //     {
    //       name: 'На подписании',
    //       type: 'case-status',
    //       id: 'status@signing'
    //     }
    //   ],
    //   hasMore: false,
    //   totalCount: 3
    // };
    // return Records.query(
    //   {
    //     sourceId: "status",
    //     query: {
    //       allAvailableByRecord: record
    //     }
    //   },
    //   {
    //     name: "name",
    //     type: "type"
    //   }
    // ).then(res => res);
  };
}
