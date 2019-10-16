import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { getCurrentUserName, t } from '../helpers/util';
import Cache from '../helpers/cache';
import { DASHBOARD_DEFAULT_KEY, QueryEntityKeys, SourcesId } from '../constants';
import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';
import { TITLE } from '../constants/pageTabs';
import { DashboardTypes } from '../constants/dashboard';
import DashboardService from '../services/dashboard';

const defaultAttr = {
  key: QueryEntityKeys.KEY,
  config: QueryEntityKeys.CONFIG_JSON,
  user: QueryEntityKeys.USER,
  type: QueryEntityKeys.TYPE,
  id: 'id'
};

const cache = new Cache('_dashboardId');

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getWidgetsByDashboardType = type => {
    return Components.getComponentsFullData(type);
  };

  getDashboardKeysByRef = function*(recordRef) {
    const result = yield Records.get(recordRef)
      .load('.atts(n:"_dashboardKey"){str,disp}')
      .then(response => response);

    let dashboardKeys = [];

    if (!isEmpty(result)) {
      dashboardKeys = result.map(item => ({
        key: item.str,
        displayName: t(item.disp)
      }));
      dashboardKeys.push({ key: DASHBOARD_DEFAULT_KEY, displayName: t('dashboard-settings.default') });
    }

    return dashboardKeys;
  };

  saveDashboardConfig = ({ identification, config }) => {
    const { key, id, user, type } = identification;
    const record = Records.get(DashboardService.formFullId(id));

    record.att(QueryEntityKeys.CONFIG_JSON, config);
    record.att(QueryEntityKeys.USER, user);
    record.att(QueryEntityKeys.KEY, key || DASHBOARD_DEFAULT_KEY);
    record.att(QueryEntityKeys.TYPE, type);

    return record.save().then(response => response);
  };

  getDashboardByOneOf = ({ dashboardId, dashboardKey, recordRef, off = {} }) => {
    if (!isEmpty(dashboardId)) {
      return this.getDashboardById(dashboardId);
    }

    if (!isEmpty(recordRef) && !off.ref) {
      return this.getDashboardByRecordRef(recordRef, dashboardKey);
    }

    if (!off.user) {
      return this.getDashboardByUser();
    }

    return {};
  };

  getDashboardById = (dashboardId, force = false) => {
    return Records.get(DashboardService.formFullId(dashboardId))
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

  getDashboardByRecordRef = function*(recordRef, dashboardKey = '') {
    const result = yield Records.get(recordRef).load({
      type: '_dashboardType',
      keys: '_dashboardKey[]?str'
    });
    const { keys, type } = result;

    let dashboardKeys = Array.from(keys || []);

    dashboardKeys.push(DASHBOARD_DEFAULT_KEY);

    if (dashboardKey) {
      dashboardKeys = dashboardKeys.filter(item => item === dashboardKey);
    }

    const cacheKey = dashboardKeys.find(key => cache.check(DashboardService.getCacheKey(key, recordRef)));
    const dashboardId = cacheKey ? cache.get(DashboardService.getCacheKey(cacheKey, recordRef)) : null;

    if (!isEmpty(dashboardId)) {
      return yield this.getDashboardById(dashboardId);
    }

    let data;

    for (let key of dashboardKeys) {
      data = yield this.getDashboardByKeyType(key, type);

      if (!isEmpty(data)) {
        cache.set(DashboardService.getCacheKey(key, recordRef), data.id);
        break;
      }
    }

    return data;
  };

  getDashboardByUser = function() {
    const user = getCurrentUserName();
    const dashboardId = cache.get(user);

    if (!isEmpty(dashboardId)) {
      return this.getDashboardById(dashboardId);
    }

    return Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query: {
          type: DashboardTypes.USER,
          user
        }
      },
      { ...defaultAttr }
    ).then(response => {
      cache.set(user, response.id);

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

    if (!recordRef) {
      return {
        ...defaultInfo,
        displayName: t(TITLE.HOMEPAGE)
      };
    }

    let type = yield Records.get(recordRef)
      .load('_dashboardType')
      .then(response => response);

    switch (type) {
      case DashboardTypes.CASE_DETAILS:
        return yield new Promise(resolve => {
          const MAX_ATTEMPT_NUMBER = 10;
          let attemptNumber = 0;
          let isForceLoad = false;
          let checkInterval;

          const fetchDisplayName = () => {
            Records.get(recordRef)
              .load(
                {
                  displayName: '.disp',
                  version: 'version',
                  pendingUpdate: 'pendingUpdate?bool'
                },
                isForceLoad
              )
              .then(response => {
                if (!response.pendingUpdate || attemptNumber > MAX_ATTEMPT_NUMBER) {
                  clearInterval(checkInterval);
                  resolve(response);
                } else {
                  attemptNumber++;
                  isForceLoad = true;
                }
              });
          };

          fetchDisplayName();
          checkInterval = setInterval(fetchDisplayName, 2000);
        });
      case DashboardTypes.SITE:
      case DashboardTypes.PROFILE:
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

  checkExistDashboard = function*({ key, type, user }) {
    return yield Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query: {
          type,
          user,
          key
        }
      },
      { user: QueryEntityKeys.USER }
    ).then(response => {
      const resUser = get(response, 'user', null);

      return {
        exist: !isEmpty(response) && (!resUser || resUser === user),
        id: get(response, 'id', null)
      };
    });
  };

  deleteFromCache(arrKeys = []) {
    const unique = Array.from(new Set(arrKeys));

    unique.forEach(key => cache.remove(key));
  }
}
