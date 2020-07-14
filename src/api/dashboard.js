import isEmpty from 'lodash/isEmpty';

import { getCurrentUserName, t } from '../helpers/util';
import Cache from '../helpers/cache';
import { EmodelTypes, SourcesId } from '../constants';
import { TITLE } from '../constants/pageTabs';
import { DashboardTypes } from '../constants/dashboard';
import Components from '../components/widgets/Components';
import Records from '../components/Records';
import { RecordService } from './recordService';
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

export class DashboardApi extends RecordService {
  getAllWidgets = () => {
    return Components.getComponentsFullData();
  };

  getWidgetsByDashboardType = type => {
    return Components.getComponentsFullData(type);
  };

  getDashboardKeysByRef = function*(recordRef) {
    const baseTypeId = EmodelTypes.BASE;
    const userDashboardId = EmodelTypes.USER_DASHBOARD;
    const dashboardKeys = [];

    let typesToSelect;
    if (recordRef) {
      const recType = yield Records.get(recordRef).load('_etype?id');

      if (recType) {
        typesToSelect = yield Records.get(recType).load('.atts(n:"parents"){id, disp}');
        if (typesToSelect) {
          typesToSelect = [...typesToSelect];
        } else {
          typesToSelect = [];
        }
        typesToSelect.unshift({
          id: recType,
          disp: yield Records.get(recType).load('.disp')
        });

        if (recType !== baseTypeId) {
          typesToSelect = typesToSelect.filter(t => t.id !== baseTypeId);
        }
      } else {
        typesToSelect = [
          {
            id: baseTypeId,
            disp: yield Records.get(baseTypeId).load('.disp')
          }
        ];
      }
    } else {
      typesToSelect = [
        {
          id: userDashboardId,
          disp: yield Records.get(userDashboardId).load('.disp')
        }
      ];
    }

    for (let p of typesToSelect) {
      dashboardKeys.push({
        key: p.id,
        displayName: p.disp
      });
    }

    return dashboardKeys;
  };

  saveDashboardConfig = ({ identification, config }) => {
    const { key, user } = identification;
    const record = Records.get(`${SourcesId.DASHBOARD}@`);

    record.att('config?json', config);
    record.att('authority?str', user);
    record.att('typeRef', key);

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
    return Records.get(`${SourcesId.DASHBOARD}@${dashboardId}`)
      .load({ ...defaultAttr, dashboardType: '_dashboardType' }, force)
      .then(response => response);
  };

  getDashboardByUserAndType = (user, typeRef) => {
    return Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query: {
          typeRef,
          authority: user
        }
      },
      { ...defaultAttr }
    );
  };

  getDashboardByRecordRef = recordRef => {
    const _getDashboardByUserAndType = this.getDashboardByUserAndType;

    function* getDashboard() {
      let { recType } = recordRef ? yield Records.get(recordRef).load({ recType: '_etype?id' }) : {};

      if (!recType) {
        recType = recordRef ? EmodelTypes.BASE : EmodelTypes.USER_DASHBOARD;
      }

      const user = getCurrentUserName();
      const cacheKey = DashboardService.getCacheKey({ type: recType, user });
      const result = cache.get(cacheKey);

      if (result) {
        return result;
      }

      const dashboard = yield _getDashboardByUserAndType(user, recType);

      cache.set(cacheKey, dashboard);

      return dashboard;
    }

    return getDashboard();
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

  isNeededRedirect(recordRef) {
    return Records.get(recordRef)
      .load('_etype?id')
      .then(type => Records.get(type).load('inhAttributes.uiType?str'))
      .then(inh => inh === 'share')
      .catch(e => {
        console.error(e);
        return false;
      });
  }
}
