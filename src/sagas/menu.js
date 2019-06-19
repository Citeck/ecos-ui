import { call, put, takeLatest } from 'redux-saga/effects';
import { setNotificationMessage } from '../actions/notification';
import {
  getAvailableMenuItems,
  getMenuConfig,
  initMenuSettings,
  saveMenuConfig,
  setAvailableMenuItems,
  setMenuConfig,
  setResultSaveMenuConfig
} from '../actions/menu';
import { t } from '../helpers/util';
import { SAVE_STATUS } from '../constants';
import * as dto from '../dto/menu';

function* doInitMenuSettings({ api, logger }, action) {
  try {
    yield put(getAvailableMenuItems());
    yield put(getMenuConfig());
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения меню')));
    logger.error('[menu/ doInitMenuSettings saga] error', e.message);
  }
}

function* doGetAvailableMenuItemsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.menu.getSlideMenuItems); // todo temp
    const menuItems = dto.getAvailableMenuItemsForWeb(apiData.items);

    yield put(setAvailableMenuItems(menuItems));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Пункты меню не получены')));
    logger.error('[menu/ doGetAvailableMenuItemsRequest saga] error', e.message);
  }
}

function* doGetMenuConfigRequest({ api, logger }, { payload }) {
  try {
    const result = yield call(api.menu.getMenuConfig);
    const menu = dto.parseGetResult(result);

    yield put(setMenuConfig(menu));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения меню')));
    logger.error('[menu/ doGetMenuConfigRequest saga] error', e.message);
  }
}

function* doSaveMenuConfigRequest({ api, logger }, { payload }) {
  try {
    const result = yield call(api.menu.saveMenuConfig, { config: payload });

    yield put(setMenuConfig(payload));
    yield put(setResultSaveMenuConfig({ status: SAVE_STATUS.SUCCESS }));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения меню')));
    logger.error('[menu/ doSaveMenuConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getMenuConfig().type, doGetMenuConfigRequest, ea);
  yield takeLatest(saveMenuConfig().type, doSaveMenuConfigRequest, ea);
  yield takeLatest(initMenuSettings().type, doInitMenuSettings, ea);
  yield takeLatest(getAvailableMenuItems().type, doGetAvailableMenuItemsRequest, ea);
}

export default saga;
