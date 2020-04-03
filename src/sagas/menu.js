import { call, put, takeLatest } from 'redux-saga/effects';
import { setNotificationMessage } from '../actions/notification';
import {
  getAvailableSoloItems,
  getMenuConfig,
  initMenuSettings,
  saveMenuConfig,
  setAvailableSoloItems,
  setMenuConfig,
  setRequestResultMenuConfig
} from '../actions/menu';
import { t } from '../helpers/util';
import { RequestStatuses } from '../constants';
import MenuConverter from '../dto/menu';

function* doInitMenuSettings({ api, logger }, action) {
  try {
    yield put(getAvailableSoloItems());
    yield put(getMenuConfig());
  } catch (e) {
    yield put(setNotificationMessage(t('menu.error')));
    logger.error('[menu/ doInitMenuSettings saga] error', e.message);
  }
}

function* doGetAvailableSoloItemsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.menu.getSlideMenuItems); // todo temp
    const menuItems = MenuConverter.getAvailableSoloItemsForWeb(apiData.items);

    yield put(setAvailableSoloItems(menuItems));
  } catch (e) {
    yield put(setNotificationMessage(t('menu.error-detail')));
    logger.error('[menu/ doGetAvailableSoloItemsRequest saga] error', e.message);
  }
}

function* doGetMenuConfigRequest({ api, logger }) {
  try {
    const result = yield call(api.menu.getMenuConfig, true);
    const menu = MenuConverter.parseGetResult(result);

    yield put(setMenuConfig(menu));
  } catch (e) {
    yield put(setNotificationMessage(t('menu.error')));
    logger.error('[menu/ doGetMenuConfigRequest saga] error', e.message);
  }
}

function* doSaveMenuConfigRequest({ api, logger }, { payload }) {
  try {
    const config = MenuConverter.getSettingsConfigForServer(payload);

    yield call(api.menu.saveMenuConfig, { config });
    yield put(setMenuConfig(payload));
    yield put(setRequestResultMenuConfig({ status: RequestStatuses.SUCCESS }));
  } catch (e) {
    yield put(setNotificationMessage(t('menu.error')));
    logger.error('[menu/ doSaveMenuConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getMenuConfig().type, doGetMenuConfigRequest, ea);
  yield takeLatest(saveMenuConfig().type, doSaveMenuConfigRequest, ea);
  yield takeLatest(initMenuSettings().type, doInitMenuSettings, ea);
  yield takeLatest(getAvailableSoloItems().type, doGetAvailableSoloItemsRequest, ea);
}

export default saga;
