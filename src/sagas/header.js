import { call, put, select, takeLatest } from 'redux-saga/effects';
import get from 'lodash/get';

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

import { makeSiteMenu, makeUserMenuItems } from '../helpers/menu';
import { getCurrentUserName, hasInString, getTextByLocale } from '../helpers/util';
import { SourcesId, URL } from '../constants';
import { selectIdentificationForView } from '../selectors/dashboard';
import MenuService from '../services/MenuService';
import PageService from '../services/PageService';
import MenuConverter from '../dto/menu';
import Records from '../components/Records';

import { HandleControlTypes } from '../helpers/handleControl';

function* fetchCreateCaseWidget({ api, logger }) {
  try {
    const workflowVars = yield call(api.menu.getCreateWorkflowVariants);

    const user = getCurrentUserName();

    //todo: temp solution to get create variants from menu config
    const menuConfig = yield Records.queryOne(
      {
        sourceId: SourcesId.RESOLVED_MENU,
        query: { user, version: 1 }
      },
      'subMenu.create?json'
    );

    // const siteVars = yield call(api.menu.getCreateVariantsForAllSites);
    // map to legacy create variants
    const _sites = (menuConfig.items || []).map(section => {
      return {
        id: section.id,
        siteId: section.id,
        label: getTextByLocale(section.label),
        items: (section.items || []).map(cvItem => {
          const cv = (cvItem.config || {}).variant || {};
          return {
            id: cv.id,
            label: getTextByLocale(cvItem.label),
            control: {
              type: HandleControlTypes.ECOS_CREATE_VARIANT,
              payload: {
                title: getTextByLocale(cv.label),
                recordRef: cv.sourceId + '@',
                formId: cv.formRef,
                canCreate: true,
                postActionRef: cv.postActionRef,
                typeRef: cv.typeRef,
                attributes: {
                  ...cv.attributes
                }
              }
            }
          };
        })
      };
    });

    const customVars = yield call(api.menu.getCustomCreateVariants);

    const _customs = MenuConverter.getCreateCustomItems(customVars);
    const { sites, customs } = MenuConverter.mergeCustomsAndSites(_customs, _sites);

    yield put(setCreateCaseWidgetItems([].concat(customs, workflowVars, sites)));

    const isCascadeMenu = yield call(api.app.getEcosConfig, 'default-ui-create-menu');

    yield put(setCreateCaseWidgetIsCascade(isCascadeMenu === 'cascad'));
  } catch (e) {
    logger.error('[fetchCreateCaseWidget saga] error', e.message);
  }
}

function* fetchUserMenu({ logger }) {
  try {
    const userData = yield select(state => state.user);
    const { userName, isDeputyAvailable: isAvailable, isMutable } = userData || {};
    const menuItems = yield call(() => makeUserMenuItems(userName, isAvailable, isMutable));

    yield put(setUserMenuItems(menuItems));
    yield put(getAppUserThumbnail());
  } catch (e) {
    logger.error('[fetchUserMenu saga] error', e.message);
  }
}

function* fetchInfluentialParams() {
  const isAdmin = yield select(state => state.user.isAdmin);
  const leftMenuEditable = yield select(state => state.app.leftMenuEditable);
  const dashboardEditable = yield select(state => state.app.dashboardEditable);

  return { isAdmin, dashboardEditable, leftMenuEditable };
}

function* fetchSiteMenu({ logger }) {
  try {
    const params = yield fetchInfluentialParams();
    const url = document.location.href;
    const isDashboardPage = hasInString(url, URL.DASHBOARD) && !hasInString(url, URL.DASHBOARD_SETTINGS);
    const menuItems = makeSiteMenu({ isDashboardPage, ...params });
    yield put(setSiteMenuItems(menuItems));
  } catch (e) {
    logger.error('[fetchSiteMenu saga] error', e.message);
  }
}

function* filterSiteMenu({ api, logger }, { payload = {} }) {
  try {
    const params = yield fetchInfluentialParams();
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

    const menuItems = makeSiteMenu({ isDashboardPage, ...params });

    yield put(setSiteMenuItems(menuItems));
  } catch (e) {
    logger.error('[filterSiteMenu saga] error', e.message);
  }
}

function* goToPageSiteMenu({ api, logger }, { payload }) {
  try {
    const dashboard = yield select(selectIdentificationForView);
    const link = yield MenuService.getSiteMenuLink(payload, dashboard);

    PageService.changeUrlLink(link, { openNewTab: true });
  } catch (e) {
    logger.error('[header goToPageSiteMenu saga] error', e.message);
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
    logger.error('[sagaRunSearchAutocomplete saga] error', e.message);
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
