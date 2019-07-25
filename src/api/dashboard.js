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
  type: 'type'
};

export class DashboardApi extends RecordService {
  cache = new Map();

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

  getDashboardById = dashboardId => {
    const id = DashboardService.parseDashboardId(dashboardId);

    return Records.get(`${SourcesId.DASHBOARD}@${id}`)
      .load({ ...defaultAttr })
      .then(response => ({ ...response, id: dashboardId }));
  };

  getDashboardByRecordRef = function*(recordRef) {
    if (this.cache.has(recordRef)) {
      return yield Records.get(this.cache.get(recordRef)).load({
        key: QueryKeys.KEY,
        config: QueryKeys.CONFIG_JSON,
        type: 'type'
      });
    }

    const result = yield Records.get(recordRef).load({
      type: '_dashboardType',
      keys: '_dashboardKey[]'
    });

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
            type,
            user: getCurrentUserName()
          }
        },
        { ...defaultAttr }
      );

      if (!isEmpty(data)) {
        break;
      }
    }

    this.cache.set(recordRef, data.id);

    return data;
  };

  getDashboardByUser = function() {
    const user = getCurrentUserName();
    const dashboardId = this.cache.get(user);

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
      this.cache.set(user, response.id);

      return response;
    });
  };

  getDashboardTitle = function*(recordRef = '') {
    if (!recordRef) {
      return TITLE.HOMEPAGE;
    }

    const title = yield Records.get(recordRef)
      .load('.disp')
      .then(response => response);

    if (!title) {
      return TITLE.NONAME;
    }

    return title;
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
