import { RecordService } from './recordService';

//todo need api
const RecordsActions = {
  getActions: (record, source, dashboardId) => {
    return [
      { title: 'Изменить права' },
      { title: 'Изменить права' },
      { title: 'Изменить права' },
      { title: 'Изменить права' },
      { title: 'Изменить права' },
      { title: 'Изменить права' },
      { title: 'Скачать', variants: [{ title: 'Оригинал' }, { title: 'PDF' }] },
      { title: 'Удалить', theme: 'warning' }
    ];
  },
  executeAction: () => true
};

export class RecordActionsApi extends RecordService {
  getActions = ({ record, dashboardId }) => {
    return RecordsActions.getActions(record, 'dashboard', dashboardId);
    //.then(res => res);
  };

  executeAction = ({ record, action }) => {
    return RecordsActions.execute(record, action);
    //.then(res => res);
  };
}
