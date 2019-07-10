import { RecordService } from './recordService';

export class DocStatusApi extends RecordService {
  getDocStatus = ({ record }) => {
    return {
      name: 'На подписании',
      type: 'case-status'
    };
    /*return {
      "records": [
        {
          "attributes": {
            "name": "На подписании",
            "type": "case-status"
          },
          "id": "status@signing"
        }
      ],
      "hasMore": false,
      "totalCount": 1
    };*/
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
    ).then(res => res);*/
  };

  getAvailableStatuses = ({ record }) => {
    return [
      {
        name: 'На подписании',
        type: 'case-status'
      },
      {
        name: 'Черновик',
        type: 'case-status'
      }
    ];
    /*return Records.query(
      {
        sourceId: "status",
        query: {
          allAvailableByRecord: record
        }
      },
      {
        name: "name",
        type: "type"
      }
    ).then(res => res);*/
  };
}
