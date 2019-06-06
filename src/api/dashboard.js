import { RecordService } from './recordService';
import Components from '../components/Components';
import uuidV3 from 'uuid/v3';

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getDashboardConfig = ({ recordId }) => {
    return this.query({
      record: `uiserv/dashboard@${recordId}`,
      attributes: {
        key: 'key',
        config: 'config?json'
      }
    }).then(resp => resp);
  };

  saveDashboardConfig = ({ recordId, config }) => {
    recordId = recordId || '';

    return this.mutate({
      records: {
        id: `uiserv/dashboard@${recordId}`,
        attributes: {
          key: 'dashboard-' + uuidV3('dashboard', uuidV3.URL), //todo ???
          config: config
        }
      }
    }).then(resp => resp);
  };
}
