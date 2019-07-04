import { call, put, takeLatest } from 'redux-saga/effects';
import {
  getAvailableWidgets,
  getDashboardConfig,
  initDashboardSettings,
  saveDashboardConfig,
  setAvailableWidgets,
  setDashboardConfig,
  setResultSaveDashboardConfig
} from '../actions/dashboardSettings';
import { setNotificationMessage } from '../actions/notification';
import { saveMenuConfig } from '../actions/menu';
import { t } from '../helpers/util';
import * as dtoDB from '../dto/dashboard';
import * as dtoDBS from '../dto/dashboardSettings';
import { SAVE_STATUS } from '../constants';

function* doInitDashboardSettingsRequest({ api, logger }, { payload }) {
  try {
    yield put(getAvailableWidgets());
    yield put(getDashboardConfig(payload));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных')));
    logger.error('[dashboard/settings/ doInitDashboardSettingsRequest saga] error', e.message);
  }
}

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const { dashboardId = '', recordRef } = payload;
    const result = dashboardId
      ? yield call(api.dashboard.getDashboardConfig, dashboardId)
      : yield call(api.dashboard.getDashboardByRecordRef, recordRef);
    let config;
    let dbId = dashboardId;
    let dashboardKey = result.key;

    if (dashboardId && result) {
      config = dtoDB.parseGetResult(result);
    } else {
      config = result ? result.data.config : dtoDB.getDefaultDashboardConfig;
    }
    if (config) {
      dbId = config.id;
    }

    const webConfig = dtoDBS.getSettingsConfigForWeb({ ...config, dashboardId: dbId, dashboardKey });

    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Настройки дашборда не получены')));
    logger.error('[dashboard/settings/ doGetDashboardConfigRequest saga] error', e.message);
  }
}

function* doGetWidgetsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.dashboard.getAllWidgets);

    yield put(setAvailableWidgets(apiData));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Список виджетов не получен')));
    logger.error('[dashboard/settings/ doGetWidgetsRequest saga] error', e.message);
  }
}

function* doSaveSettingsRequest({ api, logger }, { payload }) {
  try {
    const { dashboardId, dashboardKey } = payload;
    const serverConfig = dtoDBS.getSettingsConfigForServer(payload);
    const { layout, menu } = serverConfig;
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: { layout },
      dashboardId,
      dashboardKey
    });
    const parseDashboard = dtoDB.parseSaveResult(dashboardResult);

    yield put(saveMenuConfig(menu));
    yield put(
      setResultSaveDashboardConfig({
        status: parseDashboard.dashboardId ? SAVE_STATUS.SUCCESS : SAVE_STATUS.FAILURE,
        dashboardId: parseDashboard.dashboardId
      })
    );
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка сохранения настроек')));
    logger.error('[dashboard/settings/ doSaveSettingsRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initDashboardSettings().type, doInitDashboardSettingsRequest, ea);
  yield takeLatest(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeLatest(getAvailableWidgets().type, doGetWidgetsRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveSettingsRequest, ea);
}

export default saga;
