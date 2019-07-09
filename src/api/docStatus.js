import { RecordService } from './recordService';

export class DocStatusApi extends RecordService {
  getDocStatus = ({ record }) => {
    return {
      name: 'На подписании',
      type: 'case-status'
    };
    /*return Records.query(
      {
        sourceId: "status",
        query: {
          record
        }
      },
      {
        name: "name",
        type: "type"
      }
    ).then(res => console.log(res));*/
  };
}
