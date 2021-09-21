import { NotificationManager } from 'react-notifications';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { t } from '../helpers/util';
import { ConfigTypes, MenuSettings as ms } from '../constants/menu';
import MenuConverter from '../dto/menu';
import MenuSettingsService from '../services/MenuSettingsService';
import {
  addJournalMenuItems,
  getAuthorityInfoByRefs,
  getGroupPriority,
  getSettingsConfig,
  saveMenuSettings,
  setAuthorities,
  setCreateMenuItems,
  setGroupPriority,
  setLastAddedCreateItems,
  setLastAddedLeftItems,
  setLeftMenuItems,
  setLoading,
  setMenuIcons,
  setOriginalConfig,
  setUserMenuItems
} from '../actions/menuSettings';
import { selectMenuByType } from '../selectors/menu';

function* fetchSettingsConfig({ api, logger }) {
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

    yield put(setOriginalConfig(config));
    yield put(setLeftMenuItems(leftItems));
    yield put(setCreateMenuItems(createItems));
    yield put(setAuthorities(config.authorities));
    yield put(setUserMenuItems(userMenuItems));
    yield put(setMenuIcons({ font }));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('menu-settings.error.get-config'), t('error'));
    logger.error('[menu-settings / fetchSettingsConfig]', e.message);
  }
}

function* runSaveMenuSettings(props, action) {
  const resultMenu = yield runSaveMenuConfig(props, action);
  const resultGlobal = yield runSaveGlobalSettings(props, action);

  if (![resultMenu, resultGlobal].includes(false)) {
    MenuSettingsService.emitter.emit(MenuSettingsService.Events.HIDE);
    NotificationManager.success(t('menu-settings.success.save-all-menu-settings'), t('success'));
  }

  yield put(setLoading(false));
}

function* runSaveMenuConfig({ api, logger }, action) {
  try {
    const id = yield select(state => state.menuSettings.editedId);
    const result = yield select(state => state.menuSettings.originalConfig);
    const leftItems = yield select(state => state.menuSettings.leftItems);
    const createItems = yield select(state => state.menuSettings.createItems);
    const userMenuItems = yield select(state => state.menuSettings.userMenuItems);
    const authoritiesInfo = yield select(state => state.menuSettings.authorities);
    const authorities = authoritiesInfo.map(item => item.name);
    const newLeftItems = MenuConverter.getMenuItemsServer({ originalItems: get(result, 'menu.left.items'), items: leftItems });
    const newCreateItems = MenuConverter.getMenuItemsServer({ originalItems: get(result, 'menu.create.items'), items: createItems });
    const newUserMenuItems = MenuConverter.getMenuItemsServer({ originalItems: get(result, 'menu.user.items'), items: userMenuItems });
    const subMenu = {};

    set(subMenu, 'left.items', newLeftItems);
    set(subMenu, 'create.items', newCreateItems);
    set(subMenu, 'user.items', newUserMenuItems);

    return yield call(api.menu.saveMenuSettingsConfig, { id, subMenu, authorities, version: result.version });
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.save-config'), t('error'));
    logger.error('[menu-settings / runSaveMenuSettings]', e.message);
    return false;
  }
}

function* runSaveGlobalSettings({ api, logger }, action) {
  try {
    const _groupPriority = yield select(state => state.menuSettings.groupPriority);

    if (!isEmpty(_groupPriority)) {
      const groupPriority = MenuConverter.getGroupPriorityConfigServer(_groupPriority);

      yield call(api.menu.saveGroupPriority, { groupPriority });
    }

    return true;
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.save-group-priority'), t('error'));
    logger.error('[menu-settings / runSaveGlobalSettings]', e.message);
    return false;
  }
}

function* runAddJournalMenuItems({ api, logger }, { payload }) {
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
    logger.error('[menu-settings / runAddJournalMenuItems]', e.message);
  }
}

function* fetchGroupPriority({ api, logger }) {
  try {
    const authorities = yield select(state => state.menuSettings.authorities);
    const groupPriority = yield call(api.menu.getFullGroupPriority, { authorities });

    yield put(setGroupPriority(MenuConverter.getGroupPriorityConfigWeb(groupPriority)));
  } catch (e) {
    yield put(setGroupPriority(MenuConverter.getGroupPriorityConfigWeb([])));
    NotificationManager.error(t('menu-settings.error.get-group-priority'), t('error'));
    logger.error('[menu-settings / fetchGroupPriority]', e.message);
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

function* saga(ea) {
  yield takeLatest(saveMenuSettings().type, runSaveMenuSettings, ea);
  yield takeLatest(getSettingsConfig().type, fetchSettingsConfig, ea);
  yield takeLatest(addJournalMenuItems().type, runAddJournalMenuItems, ea);
  yield takeLatest(getGroupPriority().type, fetchGroupPriority, ea);
  yield takeLatest(getAuthorityInfoByRefs().type, fetchAuthorityInfoByRefs, ea);
}

export default saga;
