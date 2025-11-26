import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';

import { ASSOC_TYPES } from '../components/Journals/service/journalColumnsResolver';
import Records from '../components/Records';
import Components from '../components/widgets/Components';
import { ADMIN_WORKSPACE_ID, EmodelTypes, SourcesId } from '../constants';
import { DashboardTypes } from '../constants/dashboard';
import { TITLE } from '../constants/pageTabs';
import Cache from '../helpers/cache';
import { getRefWithAlfrescoPrefix, parseJournalId, parseTypeId } from '../helpers/ref';
import { getWorkspaceId } from '../helpers/urls';
import { getCurrentUserName, getEnabledWorkspaces, getMLValue, isExistIndex, t } from '../helpers/util';
import DashboardService from '../services/dashboard';

const defaultAttr = {
  id: 'id',
  config: 'config?json',
  authority: 'authority',
  user: 'authority',
  type: 'typeRef.inhDashboardType?str!appliedToRef._type.inhDashboardType?str',
  key: 'typeRef?id',
  appliedToRef: 'appliedToRef?str'
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

  getDashboardTypes = async (options, selectedType) => {
    const { dashboardId, recordRef } = options || {};
    let type;

    if (recordRef) {
      type = await Records.get(recordRef).load('_type?id');
    } else if (dashboardId) {
      const id = Helper.parseDashboardId(dashboardId);
      type = await Records.get(id).load('typeRef?id');
    } else {
      type = EmodelTypes.USER_DASHBOARD;
    }

    const types = await DashboardApi.getAvailableTypes(type, selectedType);

    return types.map(({ id: key, disp: displayName }) => ({ key, displayName }));
  };

  static getAvailableTypes = async (type, selectedType) => {
    const types = [];
    const disp = await Helper.getDisp(type || EmodelTypes.BASE);

    if (type) {
      types.push({ id: type, disp });

      if (type === EmodelTypes.USER_DASHBOARD) {
        return types;
      }

      const typeParents = await Records.get(type).load('parents[]{id:?id, disp:?disp}');

      types.push(...typeParents.filter(t => ![type, EmodelTypes.BASE].includes(t.id)));

      if (selectedType && !isExistIndex(types.findIndex(t => t.id === selectedType))) {
        const disp = await Records.get(selectedType).load('?disp');

        types.unshift({ id: selectedType, disp });
      }

      if (type !== EmodelTypes.BASE) {
        const baseI = types.findIndex(t => t.id === EmodelTypes.BASE);

        isExistIndex(baseI) && types.splice(baseI, 1);
      }
    } else {
      types.push({ id: EmodelTypes.BASE, disp });
    }

    return types;
  };

  saveDashboardConfig = ({ identification, config, recordRef = false }) => {
    const { key, type, id, user } = identification;
    const record = Records.get(`${SourcesId.DASHBOARD}@`);
    const url = window.location.pathname;

    record.att('config?json', config);
    record.att('authority?str', user);

    if (type === DashboardTypes.CUSTOM) {
      record.att('id', id);
    } else {
      record.att('typeRef', key);
    }

    if (recordRef) {
      record.att('appliedToRef?str', recordRef);
      record.att('typeRef', null);
    }

    if (url.includes('orgstructure')) {
      record.att('scope', 'orgstructure');
    }

    if (getEnabledWorkspaces()) {
      const workspaceId = getWorkspaceId();
      if (workspaceId !== ADMIN_WORKSPACE_ID) {
        record.att('workspace', getWorkspaceId());
      }
    }

    return record.save().then(response => {
      cache.clear();
      return response;
    });
  };

  createCustomDashboard = ({ id, name, onSave, onFailure }) => {
    const record = Records.get(`${SourcesId.DASHBOARD}@`);

    record.att('id', id);
    record.att('name?json', name);
    record.att('config?json', DashboardService.getEmptyDashboardConfig());

    if (getEnabledWorkspaces()) {
      record.att('workspace', getWorkspaceId());
    }

    return record
      .save()
      .then(response => {
        cache.clear();
        isFunction(onSave) && onSave(response);
        return response;
      })
      .catch(e => {
        isFunction(onFailure) && onFailure(e);
      });
  };

  getDashboardByOneOf = ({ dashboardId, recordRef }) => {
    if (!isEmpty(dashboardId)) {
      return this.getDashboardById(dashboardId, true);
    }

    return this.getDashboardByRecordRef(recordRef);
  };

  getDashboardById = async (dashboardId, force = false) => {
    const result = await Records.get(Helper.parseDashboardId(dashboardId)).load({ ...defaultAttr, dashboardType: '_dashboardType' }, force);

    if (!result.type && !result.key) {
      return {
        ...result,
        type: DashboardTypes.CUSTOM,
        key: DashboardTypes.CUSTOM
      };
    }

    return result;
  };

  getDashboardByUserAndType = (user, typeRef, recordRef) => {
    const url = window.location.pathname;
    const query = {
      typeRef,
      authority: user
    };

    if (recordRef) {
      query.recordRef = recordRef;
    }

    if (getEnabledWorkspaces()) {
      const wsId = getWorkspaceId();
      if (wsId) {
        query.workspace = wsId;
      }
    }

    if (url.includes('orgstructure')) {
      query['scope'] = 'orgstructure';
    }

    return Records.queryOne({ sourceId: SourcesId.DASHBOARD, query }, { ...defaultAttr });
  };

  getDashboardByRecordRef = async recordRef => {
    const enabledWorkspaces = getEnabledWorkspaces();
    const wsId = getWorkspaceId();
    let recType;

    if (recordRef) {
      recType = await Records.get(recordRef.replace('alfresco/@', '')).load('_etype?id', true);
    }

    let typeRef = EmodelTypes.USER_DASHBOARD;

    if (enabledWorkspaces) {
      typeRef = wsId.includes('user$') ? EmodelTypes.PERSONAL_WS_DASHBOARD : EmodelTypes.WS_DASHBOARD;
    }

    if (!recType) {
      recType = recordRef ? EmodelTypes.BASE : typeRef;
    }

    const user = getCurrentUserName();
    const query = {
      typeRef: recType,
      authority: user,
      recordRef
    };

    if (wsId && enabledWorkspaces) {
      query.workspace = wsId;
    }

    const url = window.location.pathname;

    if (url.includes('orgstructure')) {
      recType = 'emodel/type@person';
    }

    const key = await Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query
      },
      'typeRef?id'
    );

    const type = !key ? recordRef : recType;
    const params = { type, user };
    if (enabledWorkspaces) {
      params.wsId = wsId;
    }

    const cacheKey = DashboardService.getCacheKey(params);
    const result = cache.get(cacheKey);

    if (result) {
      return result;
    }

    const dashboard = await this.getDashboardByUserAndType(user, recType, recordRef);

    cache.set(cacheKey, dashboard);

    return dashboard;
  };

  getTitleInfo = async (recordRef, dashboardId) => {
    const defaultInfo = Object.freeze({
      modifier: '',
      modified: '',
      name: '',
      version: ''
    });

    if (!recordRef && !dashboardId) {
      return { ...defaultInfo, displayName: t(TITLE.HOMEPAGE) };
    }

    if (dashboardId) {
      const dashboardName = await Records.get(Helper.parseDashboardId(dashboardId)).load('name');

      return { ...defaultInfo, displayName: dashboardName ? getMLValue(dashboardName) : t(TITLE.NO_NAME) };
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

  checkExistDashboard = function* ({ key, type, user, isCustomDashboard }) {
    return yield Records.queryOne({
      sourceId: SourcesId.DASHBOARD,
      query: {
        typeRef: key,
        includeForAll: false,
        expandType: false,
        ...(!isCustomDashboard && { authority: user })
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

  getModelAttributes = ref => {
    return Records.get(parseJournalId(ref))
      .load('typeRef.model.attributes[]{id,name,type}')
      .catch(e => {
        console.error(e);
        return [];
      });
  };

  getLinkedAttributesWithJournal = async (typeRef, journalId) => {
    if (!journalId) {
      console.error('Property "journalId" is required!');
      return;
    }

    const modelAttributes = await this.getModelAttributes(journalId);

    const assocAttributes = modelAttributes.filter(att => ASSOC_TYPES.includes(att.type));
    const attrsMap = new Map();
    const attrsToLoad = assocAttributes.reduce((result, att) => {
      result[att.id] = `attributeById.${att.id}.config.typeRef._as.ref.journalRef?localId`;
      attrsMap.set(att.id, { name: att.name });
      return result;
    }, {});

    return Records.get(parseTypeId(typeRef))
      .load(attrsToLoad)
      .then((attributesWithJournalIds = {}) => {
        const attrsWithSameJournal = Object.entries(attributesWithJournalIds);

        return attrsWithSameJournal.map(([attId]) => ({ label: attrsMap.get(attId).name, value: attId }));
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  };

  static getIsAvailableWidget = (record = '', condition) => {
    if (!condition) {
      return Promise.resolve(true);
    }

    const jsonCondition = isString(condition) ? JSON.parse(condition) : condition;
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
        console.error(e);
        return false;
      });
  };
}
