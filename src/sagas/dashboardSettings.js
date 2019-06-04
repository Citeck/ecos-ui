import { delay } from 'redux-saga';
import { put, takeLatest } from 'redux-saga/effects';
import {
  getDashboardConfig,
  getMenuItems,
  getWidgets,
  initSettings,
  saveDashboardConfig,
  setDashboardConfig,
  setMenuItems,
  setStatusSaveConfigPage,
  setWidgets
} from '../actions/dashboardSettings';
import { setNotificationMessage } from '../actions/notification';
import { setLoading } from '../actions/loader';
import { t } from '../helpers/util';
import { settingsConfigForServer, settingsConfigForWeb } from '../dto/dashboardSettings';
import { SAVE_STATUS } from '../constants/dashboardSettings';
//todo test
import * as mock from '../api/mock/dashboardSettings';

function* doInitSettingsRequest({ api, logger }, action) {
  try {
    yield put(setLoading(true));
    yield doGetWidgetsRequest({ api, logger }, action);
    yield doGetMenuItemsRequest({ api, logger }, action);
    yield doGetConfigPageRequest({ api, logger }, action);
    yield put(setLoading(false));
  } catch (e) {
    logger.error('[dashboard/settings/ doInitSettingsRequest saga] error', e.message);
  }
}

function* doGetConfigPageRequest({ api, logger }, action) {
  try {
    yield delay(2000);
    const webConfig = settingsConfigForWeb(mock.getConfigPage());
    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    logger.error('[dashboard/settings/ doGetConfigPageRequest saga] error', e.message);
  }
}

function* doGetWidgetsRequest({ api, logger }, action) {
  try {
    yield delay(1000);
    yield put(setWidgets(mock.getWidgets()));
  } catch (e) {
    logger.error('[dashboard/settings/ doGetWidgetsRequest saga] error', e.message);
  }
}

function* doGetMenuItemsRequest({ api, logger }, action) {
  try {
    yield delay(1000);
    yield put(setMenuItems(mock.getMenuItems()));
  } catch (e) {
    logger.error('[dashboard/settings/ doGetMenuItemsRequest saga] error', e.message);
  }
}

function* doSaveConfigLayoutRequest({ api, logger }, { payload }) {
  try {
    yield put(setLoading(true));
    yield delay(3000);
    const serverConfig = settingsConfigForServer(payload);
    yield put(setStatusSaveConfigPage({ saveStatus: SAVE_STATUS.SUCCESS }));
    yield put(setLoading(false));
  } catch (e) {
    yield put(setStatusSaveConfigPage({ saveStatus: SAVE_STATUS.FAILURE }));
    yield put(setNotificationMessage(t('Ошибка. Данные не сохранены')));
    yield put(setLoading(false));
    logger.error('[dashboard/settings/ doSaveConfigLayoutRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSettings().type, doInitSettingsRequest, ea);
  yield takeLatest(getDashboardConfig().type, doGetConfigPageRequest, ea);
  yield takeLatest(getWidgets().type, doGetWidgetsRequest, ea);
  yield takeLatest(getMenuItems().type, doGetMenuItemsRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveConfigLayoutRequest, ea);
}

export default saga;
