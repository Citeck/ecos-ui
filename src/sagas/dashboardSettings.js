import { call, put, takeLatest } from 'redux-saga/effects';
import {
  getAllMenuItems,
  getAllWidgets,
  getDashboardConfig,
  initSettings,
  saveSettings,
  setAllMenuItems,
  setAllWidgets,
  setDashboardKey,
  setDashboardConfig,
  setResultSaveSettings
} from '../actions/dashboardSettings';
import { setNotificationMessage } from '../actions/notification';
import { setLoading } from '../actions/loader';
import { setMenuConfig } from '../actions/app';
import { t } from '../helpers/util';
import { settingsConfigForServer, settingsConfigForWeb } from '../dto/dashboardSettings';
import { getDefaultDashboardConfig, SAVE_STATUS } from '../constants/dashboardSettings';
import * as mock from '../api/mock/dashboardSettings';
function* doInitSettingsRequest({ api, logger }, action) {
  try {
    yield put(setLoading(true));
    yield doGetWidgetsRequest({ api, logger }, action);
    yield doGetMenuItemsRequest({ api, logger }, action);
    yield doGetDashboardConfigRequest({ api, logger }, action);
    yield put(setLoading(false));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных')));
    logger.error('[dashboard/settings/ doInitSettingsRequest saga] error', e.message);
  }
}

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const { recordId } = payload;
    const config = recordId ? yield call(api.dashboard.getDashboardConfig, payload) : getDefaultDashboardConfig;
    //todo menu
    const menu = yield call(api.menu.getMenuConfig, payload);
    const layout = config.layout;
    //test data
    // const menu = yield call(mock.getMenuConfig);
    // const layout = yield call(mock.getLayoutConfig);
    const webConfig = settingsConfigForWeb({ menu, layout });

    yield put(setDashboardKey(config.key));
    yield put(setMenuConfig(menu));
    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Настройки дашборда не получены')));
    logger.error('[dashboard/settings/ doGetDashboardConfigRequest saga] error', e.message);
  }
}

function* doGetWidgetsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.dashboard.getAllWidgets);

    yield put(setAllWidgets(apiData));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Список виджетов не получен')));
    logger.error('[dashboard/settings/ doGetWidgetsRequest saga] error', e.message);
  }
}

function* doGetMenuItemsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.menu.getSlideMenuItems);
    const menuItems = apiData.items;

    yield put(setAllMenuItems(menuItems));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Пункты меню не получены')));
    logger.error('[dashboard/settings/ doGetMenuItemsRequest saga] error', e.message);
  }
}

function* doSaveSettingsRequest({ api, logger }, { payload }) {
  try {
    yield put(setLoading(true));

    const serverConfig = settingsConfigForServer(payload);
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: serverConfig,
      recordId: payload.recordId
    });
    const menuResult = yield call(api.menu.saveMenuConfig, {});
    //todo menuResult
    yield put(
      setResultSaveSettings({ dashboardStatus: SAVE_STATUS.SUCCESS, menuStatus: SAVE_STATUS.SUCCESS, recordId: dashboardResult.records.id })
    );
    yield put(setLoading(false));
  } catch (e) {
    yield put(setResultSaveSettings({ dashboardStatus: SAVE_STATUS.FAILURE, menuStatus: SAVE_STATUS.FAILURE, recordId: null }));
    yield put(setNotificationMessage(t('Ошибка. Данные не сохранены')));
    yield put(setLoading(false));
    logger.error('[dashboard/settings/ doSaveSettingsRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSettings().type, doInitSettingsRequest, ea);
  yield takeLatest(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeLatest(getAllWidgets().type, doGetWidgetsRequest, ea);
  yield takeLatest(getAllMenuItems().type, doGetMenuItemsRequest, ea);
  yield takeLatest(saveSettings().type, doSaveSettingsRequest, ea);
}

export default saga;
