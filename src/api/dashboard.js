import { isEmpty } from 'lodash';
import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';
import { QueryKeys } from '../constants';

const PREFIX = 'uiserv/dashboard@';

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getDashboardConfig = recordId => {
    recordId = recordId || '';

    return Records.get(`${PREFIX}${recordId}`)
      .load([QueryKeys.CONFIG_JSON, QueryKeys.KEY])
      .then(resp => resp);
  };

  saveDashboardConfig = ({ dashboardKey, dashboardId, config }) => {
    dashboardId = dashboardId || '';
    dashboardKey = dashboardKey || QueryKeys.DEFAULT;
    const record = Records.get(`${PREFIX}${dashboardId}`);

    record.att(QueryKeys.CONFIG_JSON, config);
    record.att(QueryKeys.KEY, dashboardKey);

    return record.save().then(resp => resp);
  };

  getDashboardByRecordRef = function*(recordRef = '') {
    if (isEmpty(recordRef)) {
      return null;
    }

    const result = yield Records.get(recordRef).load('_dashboardKey[]');
    const dashboardIds = Array.from(result);
    let data;
    let key;

    dashboardIds.push(QueryKeys.DEFAULT);

    for (let value of dashboardIds) {
      key = value;
      data = yield Records.queryOne(
        {
          query: { [QueryKeys.KEY]: value },
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
