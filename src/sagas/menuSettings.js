import { NotificationManager } from 'react-notifications';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import set from 'lodash/set';
import get from 'lodash/get';

import {
  addJournalMenuItems,
  getGroupPriority,
  getSettingsConfig,
  initSettings,
  removeSettings,
  saveGroupPriority,
  saveSettingsConfig,
  setAuthorities,
  setGroupPriority,
  setLastAddedItems,
  setLoading,
  setMenuItems,
  setOpenMenuSettings
} from '../actions/menuSettings';
import { t } from '../helpers/util';
import MenuConverter from '../dto/menu';
import MenuSettingsService from '../services/MenuSettingsService';
import { LOWEST_PRIORITY, MenuSettings as ms } from '../constants/menu';

function* runInitSettings({ api, logger }, action) {
  try {
    yield put(getSettingsConfig());
  } catch (e) {
    logger.error('[menu-settings / runInitSettings]', e.message);
  }
}

function* runRemoveSettings({ api, logger }, action) {
  try {
    const { id } = yield select(state => state.menu);
    yield call(api.menu.removeSettings, { id });
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.remove-config'), t('error'));
    logger.error('[menu-settings / runRemoveSettings]', e.message);
  }
}

function* fetchSettingsConfig({ api, logger }) {
  try {
    const { id, type } = yield select(state => state.menu);
    const keyType = MenuSettingsService.getConfigKeyByType(type);

    if (!id) {
      NotificationManager.error(t('menu-settings.error.no-id-config'), t('error'));
      throw new Error('User Menu Ref has not received');
    }

    const { menu, authorities } = yield call(api.menu.getMenuSettingsConfig, { id });
    const authoritiesInfo = yield call(api.menu.getAuthoritiesInfoByName, authorities);
    const items = MenuConverter.getMenuItemsWeb(get(menu, [keyType, 'items']) || []);

    yield put(setMenuItems(items));
    yield put(setAuthorities(authoritiesInfo));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.get-config'), t('error'));
    logger.error('[menu-settings / fetchSettingsConfig]', e.message);
  }
}

function* runSaveSettingsConfig({ api, logger }, { payload }) {
  try {
    const { id, type } = yield select(state => state.menu);
    const keyType = MenuSettingsService.getConfigKeyByType(type);
    const items = yield select(state => state.menuSettings.items);
    const authoritiesInfo = yield select(state => state.menuSettings.authorities);
    const authorities = authoritiesInfo.map(item => item.name);

    const result = yield call(api.menu.getMenuSettingsConfig, { id });
    const originalItems = get(result, ['menu', keyType, 'items'], []);
    const serverData = MenuConverter.getSettingsConfigServer({ originalItems, items });

    set(result, ['subMenu', keyType], serverData);
    !authorities.length && authorities.push(LOWEST_PRIORITY);

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
    NotificationManager.error(t('menu-settings.error.set-items-from-journal'), t('error'));
    logger.error('[menu-settings / runAddJournalMenuItems]', e.message);
  }
}

function* fetchGroupPriority({ api, logger }, { payload }) {
  try {
    const authorities = yield select(state => state.menuSettings.authorities);
    const data = yield call(api.menu.getGroupPriority, { authorities });

    yield put(setGroupPriority(MenuConverter.getGroupPriorityConfigWeb(data)));
  } catch (e) {
    yield put(setGroupPriority(MenuConverter.getGroupPriorityConfigWeb([])));
    NotificationManager.error(t('menu-settings.error.get-group-priority'), t('error'));
    logger.error('[menu-settings / fetchGroupPriority]', e.message);
  }
}

function* runSaveGroupPriority({ api, logger }, { payload }) {
  try {
    const authorities = yield select(state => state.menuSettings.authorities);
    const _groupPriority = yield select(state => state.menuSettings.groupPriority);
    const groupPriority = MenuConverter.getGroupPriorityConfigServer(_groupPriority);

    yield call(api.menu.saveGroupPriority, { authorities, groupPriority }); //todo api
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.save-group-priority'), t('error'));
    logger.error('[menu-settings / runSaveGroupPriority]', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSettings().type, runInitSettings, ea);
  yield takeLatest(removeSettings().type, runRemoveSettings, ea);
  yield takeLatest(getSettingsConfig().type, fetchSettingsConfig, ea);
  yield takeLatest(saveSettingsConfig().type, runSaveSettingsConfig, ea);
  yield takeLatest(saveGroupPriority().type, runSaveGroupPriority, ea);
  yield takeLatest(addJournalMenuItems().type, runAddJournalMenuItems, ea);
  yield takeLatest(getGroupPriority().type, fetchGroupPriority, ea);
}

export default saga;
