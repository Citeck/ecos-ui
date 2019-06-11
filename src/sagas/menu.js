import { call, put, takeLatest } from 'redux-saga/effects';
import { setNotificationMessage } from '../actions/notification';
import {
  getAllMenuItems,
  getUserMenuConfig,
  initMenuSettings,
  saveUserMenuConfig,
  setAllMenuItems,
  setResultSaveUserMenu,
  setUserMenuConfig
} from '../actions/menu';
import { t } from '../helpers/util';
import { SAVE_STATUS } from '../constants';
import * as dto from '../dto/menu';

function* doInitMenuSettings({ api, logger }, action) {
  try {
    yield put(getAllMenuItems());
    yield put(getUserMenuConfig());
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения меню')));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doGetMenuItemsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.menu.getSlideMenuItems); // todo temp
    const menuItems = apiData.items;

    yield put(setAllMenuItems(menuItems));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Пункты меню не получены')));
    logger.error('[dashboard/settings/ doGetMenuItemsRequest saga] error', e.message);
  }
}

function* doGetUserMenuConfigRequest({ api, logger }, { payload }) {
  try {
    const result = yield call(api.menu.getUserMenuConfig);
    const menu = dto.parseGetResult(result);

    yield put(setUserMenuConfig(menu));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения меню')));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doSaveUserMenuConfigRequest({ api, logger }, { payload }) {
  try {
    const result = yield call(api.menu.saveUserMenuConfig, { config: payload });

    yield put(setUserMenuConfig(payload));
    yield put(setResultSaveUserMenu({ status: SAVE_STATUS.SUCCESS }));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения меню')));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getUserMenuConfig().type, doGetUserMenuConfigRequest, ea);
  yield takeLatest(saveUserMenuConfig().type, doSaveUserMenuConfigRequest, ea);
  yield takeLatest(initMenuSettings().type, doInitMenuSettings, ea);
  yield takeLatest(getAllMenuItems().type, doGetMenuItemsRequest, ea);
}

export default saga;
