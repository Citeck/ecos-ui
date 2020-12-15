import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { getCurrentUserName, isExistValue, t } from '../helpers/util';
import Cache from '../helpers/cache';
import { getRefWithAlfrescoPrefix } from '../helpers/urls';
import { EmodelTypes, SourcesId } from '../constants';
import { TITLE } from '../constants/pageTabs';
import { DashboardTypes } from '../constants/dashboard';
import Components from '../components/widgets/Components';
import Records from '../components/Records';
import DashboardService from '../services/dashboard';

const defaultAttr = {
  config: 'config?json',
  authority: 'authority',
  user: 'authority',
  type: 'typeRef.inhDashboardType?str',
  key: 'typeRef?id',
  id: 'id'
};

const cache = new Cache('_dashboardId');

const Helper = {
  getDisp: ref => Records.get(ref).load('.disp'),
  parseDashboardId: id => id && (id.includes(SourcesId.DASHBOARD) ? id : `${SourcesId.DASHBOARD}@${id}`)
};

export class DashboardApi {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getWidgetsByDashboardType = type => {
    return Components.getComponentsFullData(type);
  };

  getDashboardTypes = async options => {
    const { dashboardId, recordRef } = options || {};
    let type;

    if (recordRef) {
      type = await Records.get(recordRef).load('_etype?id');
    } else if (dashboardId) {
      const id = Helper.parseDashboardId(dashboardId);
      type = await Records.get(id).load('typeRef?id');
    } else {
      type = EmodelTypes.USER_DASHBOARD;
    }

    const types = await DashboardApi.getAvailableTypes(type);

    return types.map(({ id: key, disp: displayName }) => ({ key, displayName }));
  };

  static getAvailableTypes = async type => {
    const types = [];
    let disp;

    if (type) {
      disp = await Helper.getDisp(type);
      types.push({ id: type, disp });

      if (type === EmodelTypes.USER_DASHBOARD) {
        return types;
      }

      const typeParents = await Records.get(type).load('.atts(n:"parents"){id, disp}');

      types.push(...typeParents);

      if (type !== EmodelTypes.BASE) {
        const baseI = types.findIndex(t => t.id === EmodelTypes.BASE);
        isExistValue(baseI) && types.splice(baseI, 1);
      }
    } else {
      disp = await Helper.getDisp(EmodelTypes.BASE);
      types.push({ id: EmodelTypes.BASE, disp });
    }

    return types;
  };

  saveDashboardConfig = ({ identification, config, recordRef = false }) => {
    const { key, user } = identification;
    const record = Records.get(`${SourcesId.DASHBOARD}@`);

    record.att('config?json', config);
    record.att('authority?str', user);
    record.att('typeRef', key);

    if (recordRef) {
      record.att('appliedToRef?str', recordRef);
      record.att('typeRef', null);
    }

    return record.save().then(response => {
      cache.clear();
      return response;
    });
  };

  getDashboardByOneOf = ({ dashboardId, recordRef }) => {
    if (!isEmpty(dashboardId)) {
      return this.getDashboardById(dashboardId);
    }

    return this.getDashboardByRecordRef(recordRef);
  };

  getDashboardById = (dashboardId, force = false) => {
    return Records.get(Helper.parseDashboardId(dashboardId)).load({ ...defaultAttr, dashboardType: '_dashboardType' }, force);
  };

  getDashboardByUserAndType = (user, typeRef, recordRef) => {
    const query = {
      typeRef,
      authority: user
    };

    if (recordRef) {
      query.recordRef = recordRef;
    }

    return Records.queryOne({ sourceId: SourcesId.DASHBOARD, query }, { ...defaultAttr });
  };

  getDashboardByRecordRef = recordRef => {
    const _getDashboardByUserAndType = this.getDashboardByUserAndType;

    function* getDashboard() {
      let { recType } = recordRef ? yield Records.get(recordRef).load({ recType: '_etype?id' }, true) : {};

      if (!recType) {
        recType = recordRef ? EmodelTypes.BASE : EmodelTypes.USER_DASHBOARD;
      }

      const user = getCurrentUserName();
      const cacheKey = DashboardService.getCacheKey({ type: recType, user });
      const result = cache.get(cacheKey);

      if (result) {
        return result;
      }

      const dashboard = yield _getDashboardByUserAndType(user, recType, recordRef);

      cache.set(cacheKey, dashboard);

      return dashboard;
    }

    return getDashboard();
  };

  getTitleInfo = async recordRef => {
    const defaultInfo = Object.freeze({
      modifier: '',
      modified: '',
      name: '',
      version: ''
    });

    if (!recordRef) {
      return { ...defaultInfo, displayName: t(TITLE.HOMEPAGE) };
    }

    let type = await Records.get(recordRef).load('_dashboardType');

    switch (type) {
      case DashboardTypes.CASE_DETAILS:
        return new Promise(resolve => {
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
        const displayName = await Helper.getDisp(recordRef);

        return { ...defaultInfo, displayName };
      }
    }
  };

  checkExistDashboard = function*({ key, type, user }) {
    return yield Records.queryOne({
      sourceId: SourcesId.DASHBOARD,
      query: {
        typeRef: key,
        authority: user,
        includeForAll: false,
        expandType: false
      }
    }).then(response => {
      return {
        exist: !!response,
        id: ''
      };
    });
  };

  removeDashboard = ({ id }) => {
    const _id = `${SourcesId.DASHBOARD}@${id}`;

    return Records.remove([_id])
      .then(() => {
        cache.clear();
        return true;
      })
      .catch(() => false);
  };

  deleteFromCache(arrKeys = []) {
    const unique = Array.from(new Set(arrKeys));

    unique.forEach(key => cache.remove(key));
  }

  isRedirectOld(recordRef) {
    return Records.get(recordRef)
      .load('_etype?id')
      .then(type => Records.get(type).load('inhAttributes.uiType?str'))
      .then(inh => inh === 'share')
      .catch(e => {
        console.error(e);
        return false;
      });
  }

  getFilteredWidgets = async (widgets = [], params = {}) => {
    const checks = await Promise.all(
      widgets.map(widget => DashboardApi.getIsAvailableWidget(params.recordRef, get(widget, 'props.config.widgetDisplayCondition')))
    );

    return widgets.filter((value, index) => checks[index]);
  };

  getDisplayElementsByCondition = async (conditions = {}, params) => {
    const keys = Object.keys(conditions);
    const target = {};
    const checks = await Promise.all(keys.map(key => DashboardApi.getIsAvailableWidget(params.recordRef, conditions[key])));

    keys.forEach((key, index) => (target[key] = checks[index]));

    return target;
  };

  static getIsAvailableWidget = (record, condition) => {
    if (!condition) {
      return Promise.resolve(true);
    }

    const jsonCondition = JSON.parse(condition);
    const query = {
      record: getRefWithAlfrescoPrefix(record)
    };

    if (Array.isArray(jsonCondition)) {
      query.predicates = jsonCondition;
    } else if (typeof jsonCondition === 'object') {
      query.predicate = jsonCondition;
    } else {
      return Promise.resolve(false);
    }

    return Records.queryOne({ sourceId: SourcesId.PREDICATE, query }, 'result?bool')
      .then(response => (Array.isArray(response) ? response.every(flag => !!flag) : response))
      .catch(e => {
        console.log(e);
        return false;
      });
  };
}
