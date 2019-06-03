import { delay } from 'redux-saga';
import { put, takeLatest } from 'redux-saga/effects';
import {
  getConfigPage,
  getMenuItems,
  getWidgets,
  initSettings,
  saveConfigPage,
  setConfigPage,
  setMenuItems,
  setStatusSaveConfigPage,
  setWidgets,
  stopLoading
} from '../actions/dashboardSettings';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import { configForServer, configForWeb } from '../dto/dashboardSettings';
import { SAVE_STATUS } from '../constants/dashboardSettings';
//todo test
import * as mock from '../api/mock/dashboardSettings';

function* doInitSettingsRequest({ api, logger }, action) {
  try {
    yield put(getWidgets());
    yield put(getMenuItems());
    yield put(getConfigPage());
    yield put(stopLoading());
  } catch (e) {
    logger.error('[dashboard/settings/ doInitSettingsRequest saga] error', e.message);
  }
}

function* doGetConfigPageRequest({ api, logger }, action) {
  try {
    yield delay(2000);
    const webConfig = configForWeb(mock.getConfigPage());
    yield put(setConfigPage(webConfig));
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
    yield delay(3000);
    const serverConfig = configForServer(payload);
    yield put(setStatusSaveConfigPage({ saveStatus: SAVE_STATUS.SUCCESS }));
  } catch (e) {
    yield put(setStatusSaveConfigPage({ saveStatus: SAVE_STATUS.FAILURE }));
    yield put(setNotificationMessage(t('Ошибка. Данные не сохранены')));
    logger.error('[dashboard/settings/ doSaveConfigLayoutRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSettings().type, doInitSettingsRequest, ea);
  yield takeLatest(getConfigPage().type, doGetConfigPageRequest, ea);
  yield takeLatest(getWidgets().type, doGetWidgetsRequest, ea);
  yield takeLatest(getMenuItems().type, doGetMenuItemsRequest, ea);
  yield takeLatest(saveConfigPage().type, doSaveConfigLayoutRequest, ea);
}

export default saga;
