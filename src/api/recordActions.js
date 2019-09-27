import { RecordService } from './recordService';
import { t } from '../helpers/util';

//todo need api
const RecordsActions = {
  getActions: () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([
          { title: t('records-actions.create') },
          { title: t('records-actions.edit') },
          { title: t('records-actions.download'), variants: [{ title: t('records-actions.original') }, { title: 'PDF' }] },
          { title: t('records-actions.remove'), theme: 'warning' }
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
