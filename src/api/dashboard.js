import { RecordService } from './recordService';
import Records from '../components/Records';
import Components from '../components/Components';

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getDashboardConfig = ({ recordId, key }) => {
    const params = {
      query: {
        query: {
          record: `workspace://SpacesStore/${recordId}`
        },
        sourceId: 'uiserv/dashboard'
      },
      attributes: {
        key: key,
        config: 'config?json'
      }
    };

    return Records.queryOne(params.query, params.attributes).then(resp => {
      return resp || {};
    });
  };

  saveDashboardConfig = ({ key, config }) => {
    const record = Records.get(`uiserv/dashboard@${key}`);

    record.att('config?json', config);
    record.save();

    return record;
  };
}
