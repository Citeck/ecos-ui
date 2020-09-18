import { NotificationManager } from 'react-notifications';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
  addJournalMenuItems,
  getAuthorityInfoByRefs,
  getGroupPriority,
  getSettingsConfig,
  removeSettings,
  saveGroupPriority,
  saveSettingsConfig,
  setAuthorities,
  setGroupPriority,
  setLastAddedItems,
  setLoading,
  setMenuItems
} from '../actions/menuSettings';
import { initMenuConfig } from '../actions/menu';
import { fetchSlideMenuItems } from '../actions/slideMenu';
import { t } from '../helpers/util';
import MenuConverter from '../dto/menu';
import MenuSettingsService from '../services/MenuSettingsService';
import { MenuSettings as ms } from '../constants/menu';

function* fetchSettingsConfig({ api, logger }) {
  try {
    const type = yield select(state => state.menu.type);
    const id = yield select(state => state.menuSettings.editedId);
    const keyType = MenuSettingsService.getConfigKeyByType(type);

    if (!id) {
      NotificationManager.error(t('menu-settings.error.no-id-config'), t('error'));
      throw new Error('User Menu Ref has not received');
    }

    const { menu, authorities } = yield call(api.menu.getMenuSettingsConfig, { id });
    const items = MenuConverter.getMenuItemsWeb(get(menu, [keyType, 'items']) || []);

    yield put(setMenuItems(items));
    yield put(setAuthorities(authorities));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.get-config'), t('error'));
    logger.error('[menu-settings / fetchSettingsConfig]', e.message);
  }
}

function* runSaveSettingsConfig({ api, logger }, { payload }) {
  try {
    const config = yield select(state => state.menu);
    const { type, version } = config;
    const id = yield select(state => state.menuSettings.editedId);
    const keyType = MenuSettingsService.getConfigKeyByType(type);
    const items = yield select(state => state.menuSettings.items);
    const authoritiesInfo = yield select(state => state.menuSettings.authorities);
    const authorities = authoritiesInfo.map(item => item.name);

    const result = yield call(api.menu.getMenuSettingsConfig, { id });
    const originalItems = get(result, ['menu', keyType, 'items'], []);
    const newItems = MenuConverter.getMenuItemsServer({ originalItems, items });

    set(result, ['subMenu', keyType, 'items'], newItems);

    const resultSave = yield call(api.menu.saveMenuSettingsConfig, { id, subMenu: result.subMenu, authorities, version });

    yield put(saveGroupPriority());
    MenuSettingsService.emitter.emit(MenuSettingsService.Events.HIDE);

    if (resultSave && resultSave.id) {
      yield put(initMenuConfig());
      yield put(fetchSlideMenuItems());
    }

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
    const infoList = yield call(api.menu.getItemInfoByRef, records);
    const excluded = [];

    const data = infoList
      .filter(item => {
        const flag = type !== ms.ItemTypes.LINK_CREATE_CASE || !isEmpty(item.createVariants);
        !flag && excluded.push(t(item.label));
        return flag;
      })
      .map(({ createVariants, ...info }) => {
        info.type = type;
        return info;
      });

    const result = MenuSettingsService.processAction({ action: ms.ActionTypes.CREATE, items, id, data });

    if (excluded.length) {
      NotificationManager.warning(
        t('menu-settings.warn.set-create-items-from-journal', { names: excluded.join(', ') }),
        t('warning'),
        10000
      );
    }

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

function* runSaveGroupPriority({ api, logger }) {
  try {
    const _groupPriority = yield select(state => state.menuSettings.groupPriority);
    const groupPriority = MenuConverter.getGroupPriorityConfigServer(_groupPriority);

    yield call(api.menu.saveGroupPriority, { groupPriority });
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.save-group-priority'), t('error'));
    logger.error('[menu-settings / runSaveGroupPriority]', e.message);
  }
}

function* fetchAuthorityInfoByRefs({ api, logger }, { payload = [] }) {
  try {
    yield put(setAuthorities(payload.map(ref => ({ ref }))));

    if (payload && payload.length) {
      const authorities = yield call(api.menu.getAuthoritiesInfoByRef, payload);

      yield put(setAuthorities(authorities));
    }
  } catch (e) {
    logger.error('[menu-settings / fetchAuthorityInfoByRefs]', e.message);
  }
}

function* runRemoveSettings({ api, logger }) {
  try {
    const { id } = yield select(state => state.menu);

    if (id.includes('default-menu')) {
      NotificationManager.warning('Default menu is not deleted');
    } else {
      MenuSettingsService.emitter.emit(MenuSettingsService.Events.HIDE);
      yield call(api.menu.removeSettings, { id });
      yield put(initMenuConfig());
      yield put(fetchSlideMenuItems());
    }
    yield put(setLoading(false));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.remove-config'), t('error'));
    logger.error('[menu-settings / runRemoveSettings]', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(removeSettings().type, runRemoveSettings, ea);
  yield takeLatest(getSettingsConfig().type, fetchSettingsConfig, ea);
  yield takeLatest(saveSettingsConfig().type, runSaveSettingsConfig, ea);
  yield takeLatest(saveGroupPriority().type, runSaveGroupPriority, ea);
  yield takeLatest(addJournalMenuItems().type, runAddJournalMenuItems, ea);
  yield takeLatest(getGroupPriority().type, fetchGroupPriority, ea);
  yield takeLatest(getAuthorityInfoByRefs().type, fetchAuthorityInfoByRefs, ea);
}

export default saga;
