import { NotificationManager } from 'react-notifications';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import set from 'lodash/set';
import get from 'lodash/get';

import {
  addJournalMenuItems,
  getGroupPriority,
  getSettingsConfig,
  initSettings,
  saveGroupPriority,
  saveSettingsConfig,
  setGroupPriority,
  setLastAddedItems,
  setLoading,
  setMenuItems,
  setOpenMenuSettings,
  setSettingsConfig
} from '../actions/menuSettings';
import { t } from '../helpers/util';
import MenuConverter from '../dto/menu';
import MenuSettingsService from '../services/MenuSettingsService';
import { MenuSettings as ms } from '../constants/menu';

function* runInitSettings({ api, logger }, action) {
  try {
    yield put(getSettingsConfig());
  } catch (e) {
    logger.error('[menu-settings / runInitSettings]', e.message);
  }
}

function* fetchGetSettingsConfig({ api, logger }) {
  try {
    const result = yield call(api.menu.getMenuSettingsConfig, { id: 'test-custom-menu' }); //todo id
    const type = yield select(state => state.menu.type);
    const config = MenuConverter.getSettingsConfigWeb(result, { type });

    yield put(setSettingsConfig(config));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.get-config'), t('error'));
    logger.error('[menu-settings / fetchGetSettingsConfig]', e.message);
  }
}

function* runSaveSettingsConfig({ api, logger }, { payload }) {
  try {
    const type = yield select(state => state.menu.type);
    const id = yield select(state => state.menuSettings.id);
    const items = yield select(state => state.menuSettings.items);
    const authorities = yield select(state => state.menuSettings.authorities);

    const result = yield call(api.menu.getMenuSettingsConfig, { id });
    const originalItems = get(result, ['menu', type.toLowerCase(), 'items'], []);
    const serverData = MenuConverter.getSettingsConfigServer({ originalItems, items });

    set(result, ['subMenu', type.toLowerCase()], serverData);

    yield call(api.menu.saveMenuSettingsConfig, { id, subMenu: result.subMenu, authorities });
    yield put(saveGroupPriority(payload));
    yield put(setOpenMenuSettings(false));
    NotificationManager.success(t('menu-settings.success.save-config'), t('success'));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.save-config'), t('error'));
    logger.error('[menu-settings / runSaveSettingsConfig]', e.message);
  }
}

function* runAddJournalMenuItems({ api, logger }, { payload }) {
  try {
    const { records, id, type } = payload;
    const items = yield select(state => state.menuSettings.items);
    const data = yield call(api.menu.getItemInfoByRef, records);

    data.forEach(item => (item.type = type));

    const result = MenuSettingsService.processAction({ action: ms.ActionTypes.EDIT, items, id, data });

    yield put(setMenuItems(result.items));
    yield put(setLastAddedItems(result.newItems));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error('menu-settings.error.set-items-from-journal', t('error'));
    logger.error('[menu-settings / runAddJournalMenuItems]', e.message);
  }
}

function* fetchGetGroupPriority({ api, logger }, { payload }) {
  try {
    const authorities = yield select(state => state.menuSettings.authorities);
    const data = yield call(api.menu.getGroupPriority, { authorities }); //todo api

    yield put(setGroupPriority(MenuConverter.getGroupPriorityConfigWeb(data)));
  } catch (e) {
    NotificationManager.error('menu-settings.error.get-group-priority', t('error'));
    logger.error('[menu-settings / runAddJournalMenuItems]', e.message);
  }
}

function* runSaveGroupPriority({ api, logger }, { payload }) {
  try {
    const authorities = yield select(state => state.menuSettings.authorities);
    const _groupPriority = yield select(state => state.menuSettings.groupPriority);
    const groupPriority = MenuConverter.getGroupPriorityConfigServer(_groupPriority);

    yield call(api.menu.saveGroupPriority, { authorities, groupPriority }); //todo api
    NotificationManager.success(t('menu-settings.success.save-group-priority'), t('success'));
  } catch (e) {
    NotificationManager.error('menu-settings.error.save-group-priority', t('error'));
    logger.error('[menu-settings / runAddJournalMenuItems]', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSettings().type, runInitSettings, ea);
  yield takeLatest(getSettingsConfig().type, fetchGetSettingsConfig, ea);
  yield takeLatest(saveSettingsConfig().type, runSaveSettingsConfig, ea);
  yield takeLatest(saveGroupPriority().type, runSaveGroupPriority, ea);
  yield takeLatest(addJournalMenuItems().type, runAddJournalMenuItems, ea);
  yield takeLatest(getGroupPriority().type, fetchGetGroupPriority, ea);
}

export default saga;
