import { isEmpty } from 'lodash';
import { getCurrentUserName } from '../helpers/util';
import { QueryKeys, SourcesId } from '../constants';
import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';

const defaultAttr = {
  key: QueryKeys.KEY,
  config: QueryKeys.CONFIG_JSON
};

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  saveDashboardConfig = ({ dashboardKey, dashboardId, config }) => {
    dashboardId = dashboardId || '';
    dashboardKey = dashboardKey || QueryKeys.DEFAULT;
    const record = Records.get(`${SourcesId.DASHBOARD}@${dashboardId}`);

    record.att(QueryKeys.CONFIG_JSON, config);
    record.att(QueryKeys.KEY, dashboardKey);

    return record.save().then(response => response);
  };

  getDashboardByOneOf = ({ dashboardId, recordRef, off = {} }) => {
    if (!isEmpty(dashboardId)) {
      return this.getDashboardById(dashboardId);
    }

    if (!isEmpty(recordRef) && !off.ref) {
      return this.getDashboardByRecordRef(recordRef);
    }

    if (!off.user) {
      return this.getDashboardByUser();
    }

    return {};
  };

  getDashboardById = dashboardId => {
    return Records.get(`${SourcesId.DASHBOARD}@${dashboardId}`)
      .load({ ...defaultAttr })
      .then(response => response);
  };

  getDashboardByRecordRef = function*(recordRef) {
    const result = yield Records.get(recordRef).load({
      type: '_dashboardType',
      keys: '_dashboardKey[]'
    });
    console.log('result', result);
    const { keys, type } = result;
    const dashboardKeys = Array.from(keys || []);
    let data;

    dashboardKeys.push(QueryKeys.DEFAULT);

    for (let key of dashboardKeys) {
      data = yield Records.queryOne(
        {
          sourceId: SourcesId.DASHBOARD,
          query: {
            [QueryKeys.KEY]: key,
            type
          }
        },
        { config: QueryKeys.CONFIG_JSON }
      );

      if (!isEmpty(data)) {
        break;
      }
    }

    return data;
  };

  getDashboardByUser = function() {
    return Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query: {
          type: 'user-dashboard',
          user: getCurrentUserName()
        }
      },
      { ...defaultAttr, type: 'type' }
    ).then(response => response);
  };
}
