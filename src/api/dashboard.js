import { isEmpty } from 'lodash';
import { getCurrentUserName } from '../helpers/util';
import { QueryKeys } from '../constants';
import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';

const SOURCE_ID = 'uiserv/dashboard';

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  saveDashboardConfig = ({ dashboardKey, dashboardId, config }) => {
    dashboardId = dashboardId || '';
    dashboardKey = dashboardKey || QueryKeys.DEFAULT;
    const record = Records.get(`${SOURCE_ID}@${dashboardId}`);

    record.att(QueryKeys.CONFIG_JSON, config);
    record.att(QueryKeys.KEY, dashboardKey);

    return record.save().then(response => response);
  };

  getDashboardByOneOf = ({ dashboardId, recordRef }) => {
    if (!isEmpty(dashboardId)) {
      return this.getDashboardById(dashboardId);
    }

    if (!isEmpty(recordRef)) {
      return this.getDashboardByRecordRef(recordRef);
    }

    return this.getDashboardByUser();
  };

  getDashboardById = recordId => {
    recordId = recordId || '';

    return Records.get(`${SOURCE_ID}@${recordId}`)
      .load([QueryKeys.CONFIG_JSON, QueryKeys.KEY])
      .then(response => response);
  };

  getDashboardByRecordRef = function*(recordRef) {
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
          sourceId: SOURCE_ID
        },
        { config: QueryKeys.CONFIG_JSON }
      );

      if (data !== null) {
        break;
      }
    }

    return { data, key };
  };

  getDashboardByUser = function() {
    return Records.query(
      {
        sourceId: SOURCE_ID,
        query: {
          type: 'user-dashboard',
          user: getCurrentUserName()
        }
      },
      {
        key: QueryKeys.KEY,
        type: 'type',
        config: QueryKeys.CONFIG_JSON
      }
    ).then(response => response);
  };
}
