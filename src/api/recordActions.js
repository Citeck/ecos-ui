import { RecordService } from './recordService';

//todo need api
const RecordsActions = {
  getActions: () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([
          { title: 'Создать' },
          { title: 'Изменить' },
          { title: 'Скачать', variants: [{ title: 'Оригинал' }, { title: 'PDF' }] },
          { title: 'Удалить', theme: 'warning' }
        ]);
      }, 1500);
    });
  },
  execute: () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, 1500);
    });
  }
};

export class RecordActionsApi extends RecordService {
  getActions = ({ record, dashboardId }) => {
    return RecordsActions.getActions(record, 'dashboard', dashboardId).then(res => res);
  };

  executeAction = ({ record, action }) => {
    return RecordsActions.execute(record, action).then(res => res);
  };
}
