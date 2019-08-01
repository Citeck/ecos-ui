import { isEmpty } from 'lodash';
import { getCurrentUserName, t } from '../helpers/util';
import { QueryKeys, SourcesId } from '../constants';
import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';
import { TITLE } from '../constants/pageTabs';
import { DASHBOARD_TYPE } from '../constants/dashboard';
import DashboardService from '../services/dashboard';

const defaultAttr = {
  key: QueryKeys.KEY,
  config: QueryKeys.CONFIG_JSON,
  type: 'type',
  id: 'id'
};

class CacheDID {
  static map = new Map();

  static get = key => {
    return CacheDID.map.get(key + '_dId');
  };

  static set = (key, id) => {
    CacheDID.map.set(key + '_dId', id);
  };

  static check = key => {
    return CacheDID.map.has(key + '_dId');
  };
}

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  saveDashboardConfig = ({ identification, config }) => {
    const { key, id } = identification;
    const record = Records.get(`${SourcesId.DASHBOARD}@${id}`);

    record.att(QueryKeys.CONFIG_JSON, config);
    record.att(QueryKeys.KEY, key || QueryKeys.DEFAULT);

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

  getDashboardById = (dashboardId, force = false) => {
    const id = DashboardService.parseDashboardId(dashboardId);

    return Records.get(`${SourcesId.DASHBOARD}@${id}`)
      .load({ ...defaultAttr }, force)
      .then(response => response);
  };

  getDashboardByKeyType = (key, type) => {
    return Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query: {
          key,
          type,
          user: getCurrentUserName()
        }
      },
      { ...defaultAttr }
    ).then(response => response);
  };

  getDashboardByRecordRef = function*(recordRef) {
    const result = yield Records.get(recordRef).load({
      type: '_dashboardType',
      keys: '_dashboardKey[]'
    });

    const { keys, type } = result;
    const dashboardKeys = Array.from(keys || []);

    dashboardKeys.push(QueryKeys.DEFAULT);

    const cacheKey = dashboardKeys.find(key => CacheDID.check(key));
    const dashboardId = cacheKey ? CacheDID.get(cacheKey) : null;

    if (!isEmpty(dashboardId)) {
      return yield this.getDashboardById(dashboardId);
    }

    let data;

    for (let key of dashboardKeys) {
      data = yield this.getDashboardByKeyType(key, type);

      if (!isEmpty(data)) {
        CacheDID.set(key, data.id);
        break;
      }
    }

    return data;
  };

  getDashboardByUser = function() {
    const user = getCurrentUserName();
    const dashboardId = CacheDID.get(user);

    if (!isEmpty(dashboardId)) {
      return this.getDashboardById(dashboardId);
    }

    return Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query: {
          type: 'user-dashboard',
          user
        }
      },
      { ...defaultAttr }
    ).then(response => {
      CacheDID.set(user, response.id);

      return response;
    });
  };

  getTitleInfo = function*(recordRef = '') {
    const defaultInfo = Object.freeze({
      modifier: '',
      modified: '',
      name: '',
      version: ''
    });
    let type = yield Records.get(recordRef)
      .load('_dashboardType')
      .then(response => response);

    if (!recordRef) {
      type = DASHBOARD_TYPE.USER;
    }

    switch (type) {
      case DASHBOARD_TYPE.CASE_DETAILS:
        return yield Records.get(recordRef)
          .load({
            modifier: '.att(n:"cm:modifier"){disp,str}',
            modified: 'cm:modified',
            displayName: '.disp',
            version: 'version'
          })
          .then(response => response);
      case DASHBOARD_TYPE.USER:
        return {
          ...defaultInfo,
          displayName: t(TITLE.HOMEPAGE)
        };
      case DASHBOARD_TYPE.SITE:
      default: {
        const displayName = yield Records.get(recordRef)
          .load('.disp')
          .then(response => response);

        return {
          ...defaultInfo,
          displayName
        };
      }
    }
  };
}
