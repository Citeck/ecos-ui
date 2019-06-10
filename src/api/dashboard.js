import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';
import { QUERY_KEYS } from '../constants';

const DEFAULT_KEY = 'key';
const PREFIX = 'uiserv/dashboard@';

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getDashboardConfig = recordId => {
    recordId = recordId || '';

    return Records.get(`${PREFIX}${recordId}`)
      .load([QUERY_KEYS.CONFIG_JSON, QUERY_KEYS.KEY])
      .then(resp => resp);
  };

  saveDashboardConfig = ({ key, recordId, config }) => {
    const record = Records.get(`${PREFIX}${recordId}`);

    recordId = recordId || '';
    record.att(QUERY_KEYS.CONFIG_JSON, config);
    record.att(QUERY_KEYS.KEY, key || DEFAULT_KEY);

    return record.save().then(resp => resp);
  };
}
