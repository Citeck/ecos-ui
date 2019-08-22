import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  getAvailableWidgets,
  getDashboardConfig,
  getDashboardKeys,
  initDashboardSettings,
  saveDashboardConfig,
  setAvailableWidgets,
  setDashboardConfig,
  setDashboardKeys,
  setResultSaveDashboardConfig
} from '../actions/dashboardSettings';
import { setNotificationMessage } from '../actions/notification';
import { selectIdentificationForSet } from '../selectors/dashboard';
import { selectUserName } from '../selectors/user';
import { saveMenuConfig } from '../actions/menu';
import { t } from '../helpers/util';
import DashboardService from '../services/dashboard';
import DashboardSettingsConverter from '../dto/dashboardSettings';
import { SAVE_STATUS } from '../constants';

function* doInitDashboardSettingsRequest({ api, logger }, { payload }) {
  try {
    yield put(getDashboardConfig(payload));
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error1')));
    logger.error('[dashboard/settings/ doInitDashboardSettingsRequest saga] error', e.message);
  }
}

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const { dashboardId, recordRef } = payload;

    if (dashboardId) {
      const result = yield call(api.dashboard.getDashboardById, dashboardId, true);
      const data = DashboardService.checkDashboardResult(result);
      const webConfig = DashboardSettingsConverter.getSettingsConfigForWeb(data);

      yield put(setDashboardConfig(webConfig));
      yield put(getAvailableWidgets(data.type));
      yield put(getDashboardKeys(recordRef));
    } else {
      yield put(setNotificationMessage(t('dashboard-settings.error2')));
    }
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error2')));
    logger.error('[dashboard/settings/ doGetDashboardConfigRequest saga] error', e.message);
  }
}

function* doGetWidgetsRequest({ api, logger }, { payload }) {
  try {
    const apiData = yield call(api.dashboard.getWidgetsByDashboardType, payload);

    yield put(setAvailableWidgets(apiData));
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error3')));
    logger.error('[dashboard/settings/ doGetWidgetsRequest saga] error', e.message);
  }
}

function* doGetDashboardKeys({ api, logger }, { payload }) {
  try {
    const result = yield call(api.dashboard.getDashboardKeysByRef, payload);

    yield put(setDashboardKeys(result));
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error3')));
    logger.error('[dashboard/settings/ doGetWidgetsRequest saga] error', e.message);
  }
}

function* doSaveSettingsRequest({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserName);
    const identification = yield select(selectIdentificationForSet);
    const isChangedKey = identification.key !== payload.dashboardKey;

    const data = DashboardService.defineSavingDashboard(isChangedKey, payload.isForAllUsers, !!identification.user);

    const checkExistDashboard = yield call(api.dashboard.checkExistDashboard, {
      key: payload.dashboardKey,
      type: identification.type,
      user: payload.isForAllUsers ? null : userName
    });

    if (checkExistDashboard) {
    } else {
      const serverConfig = DashboardSettingsConverter.getSettingsConfigForServer(payload);

      const { layouts, menu } = serverConfig;
      const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
        config: { layouts },
        identification
      });
      const parseDashboard = DashboardService.parseSaveResult(dashboardResult);

      yield put(saveMenuConfig(menu));
      yield put(
        setResultSaveDashboardConfig({
          status: parseDashboard.dashboardId ? SAVE_STATUS.SUCCESS : SAVE_STATUS.FAILURE,
          dashboardId: parseDashboard.dashboardId
        })
      );
    }
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error4')));
    logger.error('[dashboard/settings/ doSaveSettingsRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initDashboardSettings().type, doInitDashboardSettingsRequest, ea);
  yield takeLatest(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeLatest(getAvailableWidgets().type, doGetWidgetsRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveSettingsRequest, ea);
  yield takeLatest(getDashboardKeys().type, doGetDashboardKeys, ea);
}

export default saga;
