import { call, put, select, takeLatest } from 'redux-saga/effects';
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';

import {
  fetchCreateCaseWidgetData,
  fetchSiteMenuData,
  fetchUserMenuData,
  goToPageFromSiteMenu,
  runSearchAutocompleteItems,
  setCreateCaseWidgetIsCascade,
  setCreateCaseWidgetItems,
  setSearchAutocompleteItems,
  setSiteMenuItems,
  setUserMenuItems
} from '../actions/header';
import { setDashboardIdentification } from '../actions/dashboard';
import { getAppUserThumbnail, validateUserSuccess } from '../actions/user';
import { changeTab } from '../actions/pageTabs';
import { setLeftMenuEditable } from '../actions/app';
import { selectIdentificationForView } from '../selectors/dashboard';
import { makeSiteMenu } from '../helpers/menu';
import { getIconObjectWeb } from '../helpers/icon';
import { SourcesId } from '../constants';
import { DefaultUserMenu } from '../constants/menu';
import MenuService from '../services/MenuService';
import PageService from '../services/PageService';
import configService, { CREATE_MENU_TYPE } from '../services/config/ConfigService';
import MenuConverter from '../dto/menu';
import { isDashboard } from '../helpers/urls';

function* fetchCreateCaseWidget({ api, logger }) {
  try {
    const createMenuView = yield call(key => configService.getValue(key), CREATE_MENU_TYPE);
    const menuConfigItems = yield call(api.menu.getMainMenuCreateVariants);
    const config = MenuConverter.getMainMenuCreateItems(menuConfigItems);

    yield put(setCreateCaseWidgetItems(config));
    yield put(setCreateCaseWidgetIsCascade(createMenuView === 'cascad'));
  } catch (e) {
    logger.error('[fetchCreateCaseWidget saga] error', e);
  }
}

function* fetchUserMenu({ api, logger }) {
  try {
    const userData = yield select(state => state.user);
    const { userName, isDeputyAvailable: isAvailable } = userData || {};
    const isExternalIDP = yield call(api.app.getIsExternalIDP);
    const config = (yield call(api.menu.getUserCustomMenuConfig, userName)) || {};

    set(config, 'items', cloneDeep(DefaultUserMenu));

    const items = MenuConverter.getUserMenuItems(config.items, { isAvailable, isExternalIDP });

    yield Promise.all(
      items.map(async item => {
        const icon = get(item, 'icon');

        if (isString(icon) && icon.indexOf(SourcesId.ICON) === 0) {
          item.icon = await api.customIcon.getIconInfo(icon);

          return;
        }

        item.icon = getIconObjectWeb(item.icon);
      })
    );

    yield put(setUserMenuItems(items));
    yield put(getAppUserThumbnail());
  } catch (e) {
    logger.error('[fetchUserMenu saga] error', e);
  }
}

function* fetchInfluentialParams() {
  const isAdmin = yield select(state => state.user.isAdmin);
  const leftMenuEditable = yield select(state => state.app.leftMenuEditable);
  const dashboardEditable = yield select(state => state.app.dashboardEditable);
  const widgetEditable = yield select(state => state.app.widgetEditable);

  return { isAdmin, dashboardEditable, widgetEditable, leftMenuEditable };
}

function* fetchSiteMenu({ logger }) {
  try {
    const params = yield fetchInfluentialParams();
    const url = document.location.href;
    const isDashboardPage = isDashboard(url);
    const menuItems = makeSiteMenu({ isDashboardPage, ...params });
    yield put(setSiteMenuItems(menuItems));
  } catch (e) {
    logger.error('[fetchSiteMenu saga] error', e);
  }
}

function* filterSiteMenu({ logger }, { payload = {} }) {
  try {
    const params = yield fetchInfluentialParams();
    const { identification = null } = payload;
    const tabLink = get(payload, 'tab.link', '');
    let { url = '' } = payload;

    if (!url && tabLink) {
      url = tabLink;
    }

    let isDashboardPage = false;

    if (identification && url) {
      isDashboardPage = Boolean(get(payload, ['identification', 'id'], null));
    }

    if (url) {
      isDashboardPage = isDashboard(url);
    }

    const menuItems = makeSiteMenu({ isDashboardPage, ...params });

    yield put(setSiteMenuItems(menuItems));
  } catch (e) {
    logger.error('[filterSiteMenu saga] error', e);
  }
}

function* goToPageSiteMenu({ logger }, { payload }) {
  try {
    const dashboard = yield select(selectIdentificationForView);
    const link = yield MenuService.getSiteMenuLink(payload, dashboard);

    PageService.changeUrlLink(link, { openNewTab: true });
  } catch (e) {
    logger.error('[header goToPageSiteMenu saga] error', e);
  }
}

function* sagaRunSearchAutocomplete({ api, logger }, { payload }) {
  try {
    const documents = yield api.menu.getLiveSearchDocuments(payload, 0);
    const sites = yield api.menu.getLiveSearchSites(payload);
    const people = yield api.menu.getLiveSearchPeople(payload);
    const noResults = !(!!sites.totalRecords + !!documents.totalRecords + !!people.totalRecords);

    yield put(setSearchAutocompleteItems({ documents, sites, people, noResults }));
  } catch (e) {
    logger.error('[sagaRunSearchAutocomplete saga] error', e);
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchCreateCaseWidgetData().type, fetchCreateCaseWidget, ea);
  yield takeLatest(fetchUserMenuData().type, fetchUserMenu, ea);
  yield takeLatest(fetchSiteMenuData().type, fetchSiteMenu, ea);
  yield takeLatest(
    [setDashboardIdentification().type, changeTab().type, validateUserSuccess().type, setLeftMenuEditable().type],
    filterSiteMenu,
    ea
  );
  yield takeLatest(goToPageFromSiteMenu().type, goToPageSiteMenu, ea);
  yield takeLatest(runSearchAutocompleteItems().type, sagaRunSearchAutocomplete, ea);
}

export default headerSaga;
