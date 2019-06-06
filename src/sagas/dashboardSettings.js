import { call, put, takeLatest } from 'redux-saga/effects';
import {
  getAllMenuItems,
  getAllWidgets,
  getDashboardConfig,
  initSettings,
  saveDashboardConfig,
  setAllMenuItems,
  setAllWidgets,
  setDashboardConfig,
  setResultSaveConfigDashboard
} from '../actions/dashboardSettings';
import { setNotificationMessage } from '../actions/notification';
import { setLoading } from '../actions/loader';
import { setMenuConfig } from '../actions/app';
import { t } from '../helpers/util';
import { settingsConfigForServer, settingsConfigForWeb } from '../dto/dashboardSettings';
import { getDefaultDashboardConfig, SAVE_STATUS } from '../constants/dashboardSettings';

function* doInitSettingsRequest({ api, logger }, action) {
  try {
    yield put(setLoading(true));
    yield doGetWidgetsRequest({ api, logger }, action);
    yield doGetMenuItemsRequest({ api, logger }, action);
    yield doGetDashboardConfigRequest({ api, logger }, action);
    yield put(setLoading(false));
  } catch (e) {
    logger.error('[dashboard/settings/ doInitSettingsRequest saga] error', e.message);
  }
}

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const { recordId } = payload;
    const apiData = recordId ? yield call(api.dashboard.getDashboardConfig, payload) : getDefaultDashboardConfig;
    const webConfig = settingsConfigForWeb(apiData);

    yield put(setMenuConfig(apiData.menu));
    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    logger.error('[dashboard/settings/ doGetDashboardConfigRequest saga] error', e.message);
  }
}

function* doGetWidgetsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.dashboard.getAllWidgets);

    yield put(setAllWidgets(apiData));
  } catch (e) {
    logger.error('[dashboard/settings/ doGetWidgetsRequest saga] error', e.message);
  }
}

function* doGetMenuItemsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.menu.getSlideMenuItems);
    const menuItems = apiData.items;

    yield put(setAllMenuItems(menuItems));
  } catch (e) {
    logger.error('[dashboard/settings/ doGetMenuItemsRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    yield put(setLoading(true));

    const serverConfig = settingsConfigForServer(payload);
    const apiData = yield call(api.dashboard.saveDashboardConfig, { config: serverConfig, recordId: payload.recordId });

    yield put(setResultSaveConfigDashboard({ status: SAVE_STATUS.SUCCESS, recordId: apiData.records.id }));
    yield put(setLoading(false));
  } catch (e) {
    yield put(setResultSaveConfigDashboard({ status: SAVE_STATUS.FAILURE, recordId: null }));
    yield put(setNotificationMessage(t('Ошибка. Данные не сохранены')));
    yield put(setLoading(false));
    logger.error('[dashboard/settings/ doSaveDashboardConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSettings().type, doInitSettingsRequest, ea);
  yield takeLatest(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeLatest(getAllWidgets().type, doGetWidgetsRequest, ea);
  yield takeLatest(getAllMenuItems().type, doGetMenuItemsRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveDashboardConfigRequest, ea);
}

export default saga;
