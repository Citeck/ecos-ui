import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getMenuConfig } from '@/actions/menu';
import {
  addJournalMenuItems,
  getAuthorityInfoByRefs,
  getGroupPriority,
  getSettingsConfig,
  saveMenuSettings,
  setAuthorities,
  setCreateMenuItems,
  setGroupPriority,
  setIsForAll,
  setLastAddedCreateItems,
  setLastAddedLeftItems,
  setIsForAllCreateMenu,
  setAuthoritiesCreateMenu,
  setLeftMenuItems,
  setLoading,
  setMenuIcons,
  setOriginalConfig,
  setUserMenuItems
} from '@/actions/menuSettings';
import { fetchSlideMenuItems } from '@/actions/slideMenu.js';
import { ConfigTypes, GROUP_EVERYONE, MenuSettings as ms } from '@/constants/menu';
import MenuConverter from '@/dto/menu';
import { t } from '@/helpers/util';
import { selectMenuByType } from '@/selectors/menu';
import MenuSettingsService from '@/services/MenuSettingsService';
import { NotificationManager } from '@/services/notifications';

function* fetchSettingsConfig({ api }) {
  try {
    const id = yield select(state => state.menuSettings.editedId);

    if (!id) {
      NotificationManager.error(t('menu-settings.error.no-id-config'), t('error'));
      throw new Error('User Menu Ref has not received');
    }

    const config = yield call(api.menu.getMenuSettingsConfig, { id });
    const leftItems = MenuConverter.getMenuItemsWeb(get(config, 'menu.left.items') || [], { configType: ConfigTypes.LEFT });
    const createItems = MenuConverter.getMenuItemsWeb(get(config, 'menu.create.items') || [], { configType: ConfigTypes.CREATE });
    const userMenuItems = MenuConverter.getMenuItemsWeb(get(config, 'menu.user.items') || [], { configType: ConfigTypes.USER });

    const _font = yield import('../fonts/citeck-leftmenu/selection.json');
    const icons = get(_font, 'icons') || [];
    const prefix = get(_font, 'preferences.fontPref.prefix') || '';
    const font = icons.map(item => ({ value: `${prefix}${get(item, 'properties.name')}`, type: 'icon' }));
    const authorities = config.authorities.filter(item => item.name !== GROUP_EVERYONE);

    yield put(setOriginalConfig(config));
    yield put(setLeftMenuItems(leftItems));
    yield put(setCreateMenuItems(createItems));
    yield put(setAuthoritiesCreateMenu(get(config, 'menu.create.allowedFor'), []));
    yield put(setIsForAllCreateMenu(isEmpty(config, 'menu.create.allowedFor'), []));
    yield put(setUserMenuItems(userMenuItems));
    yield put(setAuthorities(authorities));
    yield put(setMenuIcons({ font }));
    yield put(setIsForAll(isEmpty(authorities)));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.get-config'), t('error'));
    console.error('[menu-settings / fetchSettingsConfig]', e);
  }
}

function* runSaveMenuSettings(props, action) {
  const resultMenu = yield runSaveMenuConfig(props, action);
  const resultGlobal = yield runSaveGlobalSettings(props, action);

  if (![resultMenu, resultGlobal].includes(false)) {
    const id = yield resultMenu.load('id');
    const prevId = yield select(state => state.menuSettings.editedId);

    if (id !== prevId) {
      yield put(getMenuConfig());
      yield put(fetchSlideMenuItems());
    }

    MenuSettingsService.emitter.emit(MenuSettingsService.Events.HIDE);
    NotificationManager.success(t('menu-settings.success.save-all-menu-settings'), t('success'));
  }

  yield put(setLoading(false));
}

function* runSaveMenuConfig({ api }) {
  try {
    const id = yield select(state => state.menuSettings.editedId);
    const result = yield select(state => state.menuSettings.originalConfig);
    const leftItems = yield select(state => state.menuSettings.leftItems);
    const createMenu = yield select(state => state.menuSettings.createMenu);
    const userMenuItems = yield select(state => state.menuSettings.userMenuItems);
    const authoritiesInfo = yield select(state => state.menuSettings.authorities);
    const authorities = authoritiesInfo.map(item => item.name);
    const newLeftItems = MenuConverter.getMenuItemsServer({ originalItems: get(result, 'menu.left.items'), items: leftItems });
    const newCreateMenuItems = MenuConverter.getMenuItemsServer({
      originalItems: get(result, 'menu.create.items'),
      items: createMenu.items
    });
    const newUserMenuItems = MenuConverter.getMenuItemsServer({ originalItems: get(result, 'menu.user.items'), items: userMenuItems });
    const subMenu = {};

    set(subMenu, 'left.items', newLeftItems);
    set(subMenu, 'create', { items: newCreateMenuItems, allowedFor: createMenu.authorities || [] });
    set(subMenu, 'user.items', newUserMenuItems);

    return yield call(api.menu.saveMenuSettingsConfig, { id, subMenu, authorities, version: result.version });
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.save-config'), t('error'));
    console.error('[menu-settings / runSaveMenuSettings]', e);
    return false;
  }
}

function* runSaveGlobalSettings({ api }) {
  try {
    const _groupPriority = yield select(state => state.menuSettings.groupPriority);

    if (!isEmpty(_groupPriority)) {
      const groupPriority = MenuConverter.getGroupPriorityConfigServer(_groupPriority);

      yield call(api.menu.saveGroupPriority, { groupPriority });
    }

    return true;
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.save-group-priority'), t('error'));
    console.error('[menu-settings / runSaveGlobalSettings]', e);
    return false;
  }
}

function* runAddJournalMenuItems({ api }, { payload }) {
  try {
    const { records, id, type, level, configType } = payload;
    const items = yield select(state => selectMenuByType(state, configType));
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

    const result = MenuSettingsService.processAction({ action: ms.ActionTypes.CREATE, items, id, data, level, configType });

    if (excluded.length) {
      NotificationManager.warning(
        t('menu-settings.warn.set-create-items-from-journal', { names: excluded.join(', ') }),
        t('warning'),
        10000
      );
    }

    if (configType === ConfigTypes.LEFT) {
      yield put(setLeftMenuItems(result.items));
      yield put(setLastAddedLeftItems(result.newItems));
    }

    if (configType === ConfigTypes.CREATE) {
      yield put(setCreateMenuItems(result.items));
      yield put(setLastAddedCreateItems(result.newItems));
    }
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.set-items-from-journal'), t('error'));
    console.error('[menu-settings / runAddJournalMenuItems]', e);
  }
}

function* fetchGroupPriority({ api }) {
  try {
    const authorities = yield select(state => state.menuSettings.authorities || []);
    const groupPriority = yield call(api.menu.getFullGroupPriority, { authorities });

    yield put(setGroupPriority(MenuConverter.getGroupPriorityConfigWeb(groupPriority)));
  } catch (e) {
    yield put(setGroupPriority(MenuConverter.getGroupPriorityConfigWeb([])));
    NotificationManager.error(t('menu-settings.error.get-group-priority'), t('error'));
    console.error('[menu-settings / fetchGroupPriority]', e);
  }
}

function* fetchAuthorityInfoByRefs({ api }, { payload = [] }) {
  try {
    yield put(setAuthorities(payload.map(ref => ({ ref }))));

    if (payload && payload.length) {
      const authorities = yield call(api.menu.getAuthoritiesInfo, payload);

      yield put(setAuthorities(authorities));
    }
  } catch (e) {
    console.error('[menu-settings / fetchAuthorityInfoByRefs]', e);
  }
}

function* saga(ea) {
  yield takeLatest(saveMenuSettings().type, runSaveMenuSettings, ea);
  yield takeLatest(getSettingsConfig().type, fetchSettingsConfig, ea);
  yield takeLatest(addJournalMenuItems().type, runAddJournalMenuItems, ea);
  yield takeLatest(getGroupPriority().type, fetchGroupPriority, ea);
  yield takeLatest(getAuthorityInfoByRefs().type, fetchAuthorityInfoByRefs, ea);
}

export default saga;
