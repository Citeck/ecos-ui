import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { getCurrentUserName, t } from '../helpers/util';
import Cache from '../helpers/cache';
import { DASHBOARD_DEFAULT_KEY, QueryKeys, SourcesId } from '../constants';
import { RecordService } from './recordService';
import Components from '../components/Components';
import Records from '../components/Records';
import { TITLE } from '../constants/pageTabs';
import { DashboardTypes } from '../constants/dashboard';
import DashboardService from '../services/dashboard';

const defaultAttr = {
  key: QueryKeys.KEY,
  config: QueryKeys.CONFIG_JSON,
  user: 'user',
  type: 'type',
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

    record.att(QueryKeys.CONFIG_JSON, config);
    record.att(QueryKeys.USER, user);

    if (!id) {
      record.att('key', key || DASHBOARD_DEFAULT_KEY);
      record.att('type', type);
    }

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
      keys: '_dashboardKey[]'
    });

    const { keys, type } = result;
    let dashboardKeys = Array.from(keys || []);

    dashboardKeys.push(DASHBOARD_DEFAULT_KEY);

    if (dashboardKey) {
      dashboardKeys = dashboardKeys.filter(item => item === dashboardKey);
    }

    const cacheKey = dashboardKeys.find(key => cache.check(key));
    const dashboardId = cacheKey ? cache.get(cacheKey) : null;

    if (!isEmpty(dashboardId)) {
      return yield this.getDashboardById(dashboardId);
    }

    let data;

    for (let key of dashboardKeys) {
      data = yield this.getDashboardByKeyType(key, type);

      if (!isEmpty(data)) {
        cache.set(key, data.id);
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
        return yield Records.get(recordRef)
          .load({
            modifier: '.att(n:"cm:modifier"){disp,str}',
            modified: 'cm:modified',
            displayName: '.disp',
            version: 'version'
          })
          .then(response => response);
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
      { user: 'user' }
    ).then(response => !isEmpty(response) && get(response, 'user', null) === user);
  };

  deleteFromCache({ user, key }) {
    user && cache.remove(user);
    key && cache.remove(key);
  }
}
