import get from 'lodash/get.js';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString.js';
import set from 'lodash/set.js';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getMenuConfig, saveMenuConfig, setMenuConfig, setRequestResultMenuConfig } from '../actions/menu';
import { RequestStatuses, SourcesId } from '../constants';
import MenuConverter from '../dto/menu';
import { t } from '../helpers/util';

import { setCreateCaseWidgetIsCascade, setCreateCaseWidgetItems, setUserMenuItems } from '@/actions/header';
import { setSlideMenuItems } from '@/actions/slideMenu';
import { getAppUserThumbnail } from '@/actions/user';
import { fetchExtraItemInfo } from '@/api/menu';
import { DefaultUserMenu } from '@/constants/menu';
import SidebarConverter from '@/dto/sidebar';
import { getIconObjectWeb } from '@/helpers/icon';
import configService, { CREATE_MENU_TYPE } from '@/services/config/ConfigService';
import { NotificationManager } from '@/services/notifications';

function* doGetMenuConfigRequest({ api }) {
  try {
    const userData = yield select(state => state.user);
    const { userName, isDeputyAvailable: isAvailable } = userData || {};

    const createMenuView = yield call(key => configService.getValue(key), CREATE_MENU_TYPE);
    const { create, user, left, ...menuConfig } = yield call(api.menu.getMenuData, userName);

    // left menu
    let leftMenuItems = yield call(fetchExtraItemInfo, get(left, 'items') || [], {
      label: '.disp',
      journalId: 'id',
      journalRef: 'journalRef?id',
      createVariants: 'inhCreateVariants[]?json![]'
    });

    leftMenuItems = SidebarConverter.getMenuListWeb(leftMenuItems);
    yield put(setSlideMenuItems(leftMenuItems));

    // general configuration
    const menu = MenuConverter.parseGetResult({ ...menuConfig });
    yield put(setMenuConfig(menu));

    // create variants menu
    const menuConfigItems = yield call(fetchExtraItemInfo, get(create, 'items') || [], item =>
      get(item, 'config.variant') ? undefined : { createVariants: 'inhCreateVariants[]?json' }
    );
    const createConfig = MenuConverter.getMainMenuCreateItems(menuConfigItems);

    yield put(setCreateCaseWidgetItems(createConfig));
    yield put(setCreateCaseWidgetIsCascade(createMenuView === 'cascad'));

    // user menu
    const isExternalIDP = yield call(api.app.getIsExternalIDP);
    if (isEmpty(get(user, 'items'))) {
      set(user, 'items', DefaultUserMenu);
    }

    const userConfigItems = MenuConverter.getUserMenuItems(user.items, { isAvailable, isExternalIDP });

    yield Promise.all(
      userConfigItems.map(async item => {
        const icon = get(item, 'icon');

        if (isString(icon) && icon.indexOf(SourcesId.ICON) === 0) {
          item.icon = await api.customIcon.getIconInfo(icon);

          return;
        }

        item.icon = getIconObjectWeb(item.icon);
      })
    );

    yield put(setUserMenuItems(userConfigItems));
    yield put(getAppUserThumbnail());
  } catch (e) {
    NotificationManager.error(t('menu.error.get-config'), t('error'));
    console.error('[menu/ doGetMenuConfigRequest] error', e);
  }
}

function* doSaveMenuConfigRequest({ api }, { payload }) {
  try {
    const curSet = yield select(state => state.menu);
    const config = MenuConverter.getSettingsConfigForServer(payload);

    yield call(api.menu.saveMenuConfig, { config });
    yield put(setMenuConfig({ ...curSet, ...payload }));
    yield put(setRequestResultMenuConfig({ status: RequestStatuses.SUCCESS }));
  } catch (e) {
    NotificationManager.error(t('menu.error.save-config'), t('error'));
    console.error('[menu/ doSaveMenuConfigRequest] error', e);
  }
}

function* saga(ea) {
  yield takeLatest(getMenuConfig().type, doGetMenuConfigRequest, ea);
  yield takeLatest(saveMenuConfig().type, doSaveMenuConfigRequest, ea);
}

export default saga;
