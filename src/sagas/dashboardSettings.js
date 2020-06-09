import { call, put, select, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

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
  setDashboardKeys,
  setLoading,
  setRequestResultDashboard
} from '../actions/dashboardSettings';
import { selectIdentificationForSet } from '../selectors/dashboard';
import { selectIsAdmin, selectUserName } from '../selectors/user';
import { saveMenuConfig } from '../actions/menu';
import { t } from '../helpers/util';
import { DASHBOARD_DEFAULT_KEY, RequestStatuses } from '../constants';
import DashboardService from '../services/dashboard';
import DashboardSettingsConverter from '../dto/dashboardSettings';
import MenuConverter from '../dto/menu';

function* doInitDashboardSettingsRequest({ api, logger }, { payload }) {
  try {
    yield put(getDashboardConfig(payload));
  } catch (e) {
    logger.error('[dashboard-settings/ doInitDashboardSettingsRequest saga] error', e.message);
  }
}

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  const { dashboardId, recordRef, key } = payload;

  try {
    if (dashboardId) {
      const result = yield call(api.dashboard.getDashboardById, dashboardId, true);
      const data = DashboardService.checkDashboardResult(result);
      const webConfigs = DashboardSettingsConverter.getSettingsForWeb(data);

      yield put(setDashboardConfig({ ...webConfigs, key }));
      yield put(getAvailableWidgets({ type: data.type, key }));
      yield put(getDashboardKeys({ recordRef, key }));
    } else {
      throw new Error('No dashboard ID');
    }
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
    const keys = yield call(api.dashboard.getDashboardKeysByRef, payload.recordRef);

    yield put(setDashboardKeys({ keys, key: payload.key }));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.get-board-key'), t('error'));
    logger.error('[dashboard-settings/ doGetDashboardKeys saga] error', e.message);
  }
}

function* doResetConfigToDefault({ api, logger }, { payload }) {
  try {
    const identification = yield select(selectIdentificationForSet);
    console.log(identification);
    NotificationManager.success(t('dashboard-settings.success.reset-config'), t('success'));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.reset-config'), t('error'));
    logger.error('[dashboard-settings/ doGetDashboardKeys saga] error', e.message);
  }
}

function* doCheckUpdatedSettings({ api, logger }, { payload }) {
  try {
    const identification = yield select(selectIdentificationForSet);
    const user = payload.isForAllUsers ? null : identification.user;
    const eqKey = identification.key === payload.dashboardKey;
    const hasUser = !!identification.user;

    let saveWay =
      payload.dashboardKey === DASHBOARD_DEFAULT_KEY
        ? DashboardService.SaveWays.UPDATE
        : DashboardService.defineWaySavingDashboard(eqKey, payload.isForAllUsers, hasUser);
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
    const serverConfig = {
      layouts: DashboardSettingsConverter.getSettingsConfigForServer(payload),
      menu: MenuConverter.getSettingsConfigForServer(payload),
      mobile: DashboardSettingsConverter.getSettingsMobileConfigForServer(payload)
    };
    const { layouts, menu, mobile } = serverConfig;
    const identification = yield select(selectIdentificationForSet);
    const newIdentification = payload.newIdentification || {};
    const isAdmin = yield select(selectIsAdmin);
    const identificationData = { ...identification, ...newIdentification };

    if (!isAdmin) {
      const user = yield select(selectUserName);

      if (!user) {
        throw new Error(' No user name');
      }

      identificationData.user = user;
    }

    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: { layouts, mobile },
      identification: identificationData
    });

    const parseDashboard = DashboardService.parseRequestResult(dashboardResult);
    const request = {
      status: parseDashboard.dashboardId ? RequestStatuses.SUCCESS : RequestStatuses.FAILURE,
      dashboardId: parseDashboard.dashboardId
    };

    yield call(api.dashboard.deleteFromCache, [
      DashboardService.getCacheKey(identification.key, payload.recordRef),
      identification.user,
      DashboardService.getCacheKey(newIdentification.key, payload.recordRef),
      newIdentification.user
    ]);
    yield put(saveMenuConfig(menu));
    yield put(setRequestResultDashboard({ request, key: payload.key }));
  } catch (e) {
    yield put(setLoading({ key: payload.key, status: false }));
    NotificationManager.error(t('dashboard-settings.error.save-config'), t('error'));
    logger.error('[dashboard-settings/ doSaveSettingsRequest saga] error', e.message);
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
