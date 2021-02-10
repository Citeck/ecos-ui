import { call, put, select, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';
import queryString from 'query-string';
import get from 'lodash/get';

import {
  getAvailableWidgets,
  getCheckUpdatedDashboardConfig,
  getDashboardConfig,
  getDashboardKeys,
  initDashboardSettings,
  resetConfigToDefault,
  saveDashboardConfig,
  setAvailableWidgets,
  setCheckUpdatedDashboardConfig,
  setDashboardConfig,
  setDashboardData,
  setDashboardKeys,
  setLoading,
  setLoadingKeys,
  setRequestResultDashboard
} from '../actions/dashboardSettings';
import { selectIdentificationForSet } from '../selectors/dashboard';
import { selectIsAdmin, selectUserName } from '../selectors/user';
import { t } from '../helpers/util';
import { RequestStatuses } from '../constants';
import DashboardService from '../services/dashboard';
import PageService from '../services/PageService';
import DashboardSettingsConverter from '../dto/dashboardSettings';
import { CONFIG_VERSION } from '../constants/dashboard';
import { selectNewVersionConfig, selectOriginalConfig, selectRecordRef, selectSelectedWidgetsById } from '../selectors/dashboardSettings';
import DashboardConverter from '../dto/dashboard';
import { getRefWithAlfrescoPrefix, getSearchParams } from '../helpers/urls';

function* doInitDashboardSettingsRequest({ api, logger }, { payload }) {
  try {
    yield put(getDashboardConfig(payload));
  } catch (e) {
    logger.error('[dashboard-settings/ doInitDashboardSettingsRequest saga] error', e.message);
  }
}

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  const { key } = payload;

  try {
    yield put(setDashboardData({ key, recordRef: get(getSearchParams(), 'recordRef') }));

    let { recordRef } = payload;

    if (recordRef) {
      recordRef = getRefWithAlfrescoPrefix(recordRef);
    }

    const { config, ...result } = yield call(api.dashboard.getDashboardByOneOf, { ...payload, recordRef });
    const migratedConfig = DashboardService.migrateConfigFromOldVersion(config);
    const newConfig = yield select(() => selectNewVersionConfig(migratedConfig));
    const widgetsById = yield select(() => selectSelectedWidgetsById(newConfig));
    const data = DashboardService.checkDashboardResult(result);
    const webConfigs = DashboardSettingsConverter.getSettingsForWeb(newConfig, widgetsById, migratedConfig.version);

    webConfigs.identification = DashboardConverter.getKeyInfoDashboardForWeb(data).identification;

    if (recordRef && !webConfigs.identification.key) {
      webConfigs.identification.key = recordRef;
    }

    yield put(setDashboardConfig({ ...webConfigs, key, originalConfig: config }));
    yield put(getAvailableWidgets({ type: data.type, key }));
    yield put(getDashboardKeys(payload));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.get-config'), t('error'));
    logger.error('[dashboard-settings/ doGetDashboardConfigRequest saga] error', e.message);
  } finally {
    yield put(setLoading({ key: payload.key, status: false }));
  }
}

function* doGetWidgetsRequest({ api, logger }, { payload }) {
  try {
    const widgets = yield call(api.dashboard.getWidgetsByDashboardType, payload.type);

    yield put(setAvailableWidgets({ widgets, key: payload.key }));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.get-widget-list'), t('error'));
    logger.error('[dashboard-settings/ doGetWidgetsRequest saga] error', e.message);
  }
}

function* doGetDashboardKeys({ api, logger }, { payload }) {
  try {
    yield put(setLoadingKeys({ status: true, key: payload.key }));

    const keys = yield call(api.dashboard.getDashboardTypes, payload);
    const recordRef = yield select(state => selectRecordRef(state, payload.key));

    if (recordRef) {
      const displayName = get(yield call(api.dashboard.getTitleInfo, recordRef), 'displayName');

      keys.unshift({ key: recordRef, displayName });
    }

    yield put(setDashboardKeys({ keys, key: payload.key }));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.get-board-key'), t('error'));
    logger.error('[dashboard-settings/ doGetDashboardKeys saga] error', e.message);
  } finally {
    yield put(setLoadingKeys({ status: false, key: payload.key }));
  }
}

function* doCheckUpdatedSettings({ api, logger }, { payload }) {
  try {
    const identification = yield select(selectIdentificationForSet, payload.key);
    const user = payload.isForAllUsers ? null : identification.user;
    const eqKey = identification.key === payload.dashboardKey;
    const hasUser = !!identification.user;

    let saveWay = DashboardService.defineWaySavingDashboard(eqKey, payload.isForAllUsers, hasUser);
    let dashboardId = identification.id;

    if (saveWay === DashboardService.SaveWays.CONFIRM) {
      const checkResult = yield call(api.dashboard.checkExistDashboard, {
        key: payload.dashboardKey,
        type: identification.type,
        user
      });

      if (checkResult.id) {
        dashboardId = checkResult.id;
      }

      if (!checkResult.exist) {
        saveWay = DashboardService.SaveWays.CREATE;
      }
    }

    if (saveWay === DashboardService.SaveWays.CREATE) {
      dashboardId = '';
    }

    yield put(setCheckUpdatedDashboardConfig({ saveWay, dashboardId, key: payload.key }));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.check-updates'), t('error'));
    logger.error('[dashboard-settings/ doCheckUpdatedSettings saga] error', e.message);
  }
}

function* doSaveSettingsRequest({ api, logger }, { payload }) {
  try {
    const identification = yield select(selectIdentificationForSet, payload.key);
    const newIdentification = payload.newIdentification || {};
    const isAdmin = yield select(selectIsAdmin);
    const identificationData = { ...identification, ...newIdentification };
    let recordRef = yield select(state => selectRecordRef(state, payload.key));

    if (!isAdmin) {
      const user = yield select(state => {
        return selectUserName(state);
      });

      if (!user) {
        throw new Error('No user name');
      }

      identificationData.user = user;
    }

    if (recordRef && identificationData.key === recordRef) {
      recordRef = getRefWithAlfrescoPrefix(recordRef);
    } else {
      recordRef = '';
    }

    const originalConfig = yield select(state => selectOriginalConfig(state, payload.key));
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: {
        ...originalConfig,
        [CONFIG_VERSION]: DashboardSettingsConverter.getNewSettingsConfigForServer(payload),
        version: CONFIG_VERSION
      },
      identification: identificationData,
      recordRef
    });

    const parseDashboard = DashboardService.parseRequestResult(dashboardResult);
    const request = {
      status: parseDashboard.dashboardId ? RequestStatuses.SUCCESS : RequestStatuses.FAILURE,
      dashboardId: parseDashboard.dashboardId
    };

    yield call(api.dashboard.deleteFromCache, [
      DashboardService.getCacheKey({ type: identification.key, user: identification.user }),
      DashboardService.getCacheKey({ type: newIdentification.key, user: newIdentification.user })
    ]);
    yield put(setRequestResultDashboard({ request, key: payload.key }));
  } catch (e) {
    yield put(setLoading({ key: payload.key, status: false }));
    NotificationManager.error(t('dashboard-settings.error.save-config'), t('error'));
    logger.error('[dashboard-settings/ doSaveSettingsRequest saga] error', e.message);
  }
}

function* doResetConfigToDefault({ api, logger }, { payload }) {
  const { key, recordRef } = payload;

  try {
    const identification = yield select(selectIdentificationForSet, key);
    const isRemoved = yield call(api.dashboard.removeDashboard, { id: identification.id, recordRef });

    if (isRemoved) {
      const result = yield call(api.dashboard.getDashboardByRecordRef, recordRef);
      const dashboardId = result.id;

      PageService.changeUrlLink(
        queryString.stringifyUrl({ url: `${window.location.pathname}${window.location.search}`, query: { dashboardId } }),
        { updateUrl: true }
      );

      NotificationManager.success(t('dashboard-settings.success.reset-config'), t('success'));
    }
  } catch (e) {
    yield put(setLoading({ key, status: false }));
    NotificationManager.error(t('dashboard-settings.error.reset-config'), t('error'));
    logger.error('[dashboard-settings/ doGetDashboardKeys saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(initDashboardSettings().type, doInitDashboardSettingsRequest, ea);
  yield takeEvery(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeEvery(getAvailableWidgets().type, doGetWidgetsRequest, ea);
  yield takeEvery(saveDashboardConfig().type, doSaveSettingsRequest, ea);
  yield takeEvery(getDashboardKeys().type, doGetDashboardKeys, ea);
  yield takeEvery(getCheckUpdatedDashboardConfig().type, doCheckUpdatedSettings, ea);
  yield takeEvery(resetConfigToDefault().type, doResetConfigToDefault, ea);
}

export default saga;
