import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { getCurrentUserName, t } from '../helpers/util';
import Cache from '../helpers/cache';
import { DASHBOARD_DEFAULT_KEY, QueryEntityKeys, SourcesId } from '../constants';
import { RecordService } from './recordService';
import Components from '../components/widgets/Components';
import Records from '../components/Records';
import { TITLE } from '../constants/pageTabs';
import { DashboardTypes } from '../constants/dashboard';
import DashboardService from '../services/dashboard';

const defaultAttr = {
  config: 'config?json',
  authority: 'authority',
  typeRef: 'typeRef?id',
  type: 'typeRef.dashboardType?str',
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
    const { key, user, type } = identification;

    const record = Records.get('eapps/module@ui/dashboard$');

    record.att(QueryEntityKeys.CONFIG_JSON, config);
    record.att(QueryEntityKeys.USER, user);
    record.att(QueryEntityKeys.KEY, key || DASHBOARD_DEFAULT_KEY);
    record.att(QueryEntityKeys.TYPE, type);

    return record.save().then(response => response);
  };

  getDashboardByOneOf = ({ dashboardId, recordRef, off = {} }) => {
    if (!isEmpty(dashboardId)) {
      return this.getDashboardById(dashboardId);
    }

    return this.getDashboardByRecordRef(recordRef);
  };

  getDashboardById = (dashboardId, force = false) => {
    return Records.get(DashboardService.formFullId(dashboardId))
      .load({ ...defaultAttr }, force)
      .then(response => response);
  };

  getDashboardByUserAndType = (user, typeRef) => {
    return Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query: {
          typeRef,
          user
        }
      },
      { ...defaultAttr }
    );
  };

  getDashboardByRecordRef = function*(recordRef) {
    let recType = null;

    if (recordRef) {
      recType = yield Records.get(recordRef).load('_etype{.id,dashboardType}');
    }

    const user = getCurrentUserName();

    const cacheKey = `${recType}|${user}`;

    let result = cache.get(cacheKey);
    if (result) {
      return result;
    }

    let dashboard = yield this.getDashboardByUserAndType(user, recType);
    cache.set(cacheKey, dashboard);

    return dashboard;
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
