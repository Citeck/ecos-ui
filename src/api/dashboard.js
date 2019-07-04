import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';
import { QUERY_KEYS } from '../constants';

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

  saveDashboardConfig = ({ dashboardKey, dashboardId, config }) => {
    dashboardId = dashboardId || '';
    dashboardKey = dashboardKey || QUERY_KEYS.DEFAULT;
    const record = Records.get(`${PREFIX}${dashboardId}`);

    record.att(QUERY_KEYS.CONFIG_JSON, config);
    record.att(QUERY_KEYS.KEY, dashboardKey);

    return record.save().then(resp => resp);
  };

  getDashboardByRecordRef = function*(recordRef = '') {
    if (!recordRef) {
      return null;
    }

    const result = yield Records.get(recordRef).load('_dashboardKey[]');
    const dashboardIds = Array.from(result);
    let data;
    let key;

    dashboardIds.push(QUERY_KEYS.DEFAULT);

    for (let value of dashboardIds) {
      key = value;
      data = yield Records.queryOne(
        {
          query: { [QUERY_KEYS.KEY]: value },
          sourceId: 'uiserv/dashboard'
        },
        { config: 'config?json' }
      );

      if (data !== null) {
        break;
      }
    }

    return { data, key };
  };
}
