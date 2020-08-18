import { call, put, select, takeLatest } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  fetchCreateCaseWidgetData,
  fetchSiteMenuData,
  fetchUserMenuData,
  goToPageFromSiteMenu,
  runActionFromSiteMenu,
  runSearchAutocompleteItems,
  setCreateCaseWidgetIsCascade,
  setCreateCaseWidgetItems,
  setSearchAutocompleteItems,
  setSiteMenuItems,
  setUserMenuItems
} from '../actions/header';
import { setOpenMenuSettings } from '../actions/menuSettings';
import { setDashboardIdentification } from '../actions/dashboard';
import { setUserThumbnail, validateUserSuccess } from '../actions/user';
import { changeTab } from '../actions/pageTabs';
import { makeSiteMenu, makeUserMenuItems } from '../helpers/menu';
import { createThumbnailUrl } from '../helpers/urls';
import { hasInString } from '../helpers/util';
import { URL } from '../constants';
import { selectIdentificationForView } from '../selectors/dashboard';
import MenuService from '../services/MenuService';
import PageService from '../services/PageService';
import MenuConverter from '../dto/menu';

function* fetchCreateCaseWidget({ api, logger }) {
  try {
    const workflowVars = yield call(api.menu.getCreateWorkflowVariants);
    const siteVars = yield call(api.menu.getCreateVariantsForAllSites);
    const customVars = yield call(api.menu.getCustomCreateVariants);

    const _sites = MenuConverter.getCreateSiteItems(siteVars);
    const _customs = MenuConverter.getCreateCustomItems(customVars);
    const { sites, customs } = MenuConverter.mergeCustomsAndSites(_customs, _sites);

    yield put(setCreateCaseWidgetItems([].concat(customs, workflowVars, sites)));

    const isCascadeMenu = yield call(api.app.getEcosConfig, 'default-ui-create-menu');
    yield put(setCreateCaseWidgetIsCascade(isCascadeMenu === 'cascad'));
  } catch (e) {
    logger.error('[fetchCreateCaseWidget saga] error', e.message);
  }
}

function* fetchUserMenu({ api, fakeApi, logger }) {
  try {
    const userName = yield select(state => state.user.userName);
    const isAvailable = yield select(state => state.user.isAvailable);
    const isMutable = yield select(state => state.user.isMutable);

    // TODO use real api
    const isExternalAuthentication = yield call(fakeApi.getIsExternalAuthentication);

    const menuItems = yield call(() => makeUserMenuItems(userName, isAvailable, isMutable, isExternalAuthentication));
    yield put(setUserMenuItems(menuItems));

    const userNodeRef = yield select(state => state.user.nodeRef);
    if (userNodeRef) {
      const userPhotoSize = yield call(api.user.getPhotoSize, userNodeRef);
      if (userPhotoSize > 0) {
        const photoUrl = createThumbnailUrl(userNodeRef);
        yield put(setUserThumbnail(photoUrl));
      }
    }
  } catch (e) {
    logger.error('[fetchUserMenu saga] error', e.message);
  }
}

function* fetchSiteMenu({ api, fakeApi, logger }) {
  try {
    const isAdmin = yield select(state => state.user.isAdmin);
    const url = document.location.href;
    const isDashboardPage = hasInString(url, URL.DASHBOARD) && !hasInString(url, URL.DASHBOARD_SETTINGS);
    const menuItems = makeSiteMenu({ isDashboardPage, isAdmin });
    yield put(setSiteMenuItems(menuItems));
  } catch (e) {
    logger.error('[fetchSiteMenu saga] error', e.message);
  }
}

function* filterSiteMenu({ api, logger }, { payload = {} }) {
  try {
    const isAdmin = yield select(state => state.user.isAdmin);
    const { identification = null } = payload;
    const tabLink = get(payload, 'tab.link', '');
    let { url = '' } = payload;

    if (!url && tabLink) {
      url = tabLink;
    }

    let isDashboardPage = false;

    if (identification) {
      isDashboardPage = Boolean(get(payload, ['identification', 'id'], null));
    }

    if (url) {
      isDashboardPage = hasInString(url, URL.DASHBOARD) && !hasInString(url, URL.DASHBOARD_SETTINGS);
    }

    const menuItems = makeSiteMenu({ isDashboardPage, isAdmin });

    yield put(setSiteMenuItems(menuItems));
  } catch (e) {
    logger.error('[filterSiteMenu saga] error', e.message);
  }
}

function* goToPageSiteMenu({ api, fakeApi, logger }, { payload }) {
  try {
    const dashboard = yield select(selectIdentificationForView);
    const link = yield MenuService.getSiteMenuLink(payload, dashboard);

    PageService.changeUrlLink(link, { openNewTab: true });
  } catch (e) {
    logger.error('[header goToPageSiteMenu saga] error', e.message);
  }
}

function* runActionSiteMenu({ api, fakeApi, logger }, { payload }) {
  try {
    if (payload.id === 'SETTINGS_MENU') {
      yield put(setOpenMenuSettings(true));
    }
  } catch (e) {
    logger.error('[header runActionSiteMenu saga] error', e.message);
  }
}

function* sagaRunSearchAutocomplete({ api, fakeApi, logger }, { payload }) {
  try {
    const documents = yield api.menu.getLiveSearchDocuments(payload, 0);
    const sites = yield api.menu.getLiveSearchSites(payload);
    const people = yield api.menu.getLiveSearchPeople(payload);
    const noResults = !(!!sites.totalRecords + !!documents.totalRecords + !!people.totalRecords);

    yield put(setSearchAutocompleteItems({ documents, sites, people, noResults }));
  } catch (e) {
    logger.error('[sagaRunSearchAutocomplete saga] error', e.message);
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchCreateCaseWidgetData().type, fetchCreateCaseWidget, ea);
  yield takeLatest(fetchUserMenuData().type, fetchUserMenu, ea);
  yield takeLatest(fetchSiteMenuData().type, fetchSiteMenu, ea);
  yield takeLatest([setDashboardIdentification().type, changeTab().type, validateUserSuccess().type], filterSiteMenu, ea);
  yield takeLatest(goToPageFromSiteMenu().type, goToPageSiteMenu, ea);
  yield takeLatest(runActionFromSiteMenu().type, runActionSiteMenu, ea);
  yield takeLatest(runSearchAutocompleteItems().type, sagaRunSearchAutocomplete, ea);
}

export default headerSaga;
