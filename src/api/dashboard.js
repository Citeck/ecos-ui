import { RecordService } from './recordService';
import Components from '../components/Components';

const DEFAULT_KEY = 'key';

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getDashboardConfig = recordId => {
    recordId = recordId || '';

    return this.query({
      record: `uiserv/dashboard@${recordId}`,
      attributes: {
        key: DEFAULT_KEY,
        config: 'config?json'
      }
    }).then(resp => resp);
  };

  saveDashboardConfig = ({ key, recordId, config }) => {
    recordId = recordId || '';

    return this.mutate({
      records: {
        id: `uiserv/dashboard@${recordId}`,
        attributes: {
          key: key || DEFAULT_KEY,
          config: config
        }
      }
    }).then(resp => resp);
  };
}
