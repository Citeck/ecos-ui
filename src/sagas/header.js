import get from 'lodash/get';
import isString from 'lodash/isString';
import set from 'lodash/set';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { setLeftMenuEditable } from '../actions/app';
import { setDashboardIdentification } from '../actions/dashboard';
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
import { changeTab } from '../actions/pageTabs';
import { getAppUserThumbnail, validateUserSuccess } from '../actions/user';
import { LiveSearchAttributes } from '../api/menu';
import { SourcesId } from '../constants';
import { DefaultUserMenu } from '../constants/menu';
import MenuConverter from '../dto/menu';
import { getIconObjectWeb } from '../helpers/icon';
import { makeSiteMenu } from '../helpers/menu';
import { getBaseUrlWorkspace, isDashboard } from '../helpers/urls';
import { getMLValue } from '../helpers/util';
import { selectIdentificationForView } from '../selectors/dashboard';
import MenuService from '../services/MenuService';
import PageService from '../services/PageService';
import configService, { CREATE_MENU_TYPE } from '../services/config/ConfigService';
import { LiveSearchTypes } from '../services/search';

import { getSidebarWorkspaces } from '@/actions/workspaces';

function* fetchCreateCaseWidget({ api }) {
  try {
    const createMenuView = yield call(key => configService.getValue(key), CREATE_MENU_TYPE);
    const menuConfigItems = yield call(api.menu.getMainMenuCreateVariants);
    const config = MenuConverter.getMainMenuCreateItems(menuConfigItems);

    yield put(setCreateCaseWidgetItems(config));
    yield put(setCreateCaseWidgetIsCascade(createMenuView === 'cascad'));
  } catch (e) {
    console.error('[fetchCreateCaseWidget saga] error', e);
  }
}

function* fetchUserMenu({ api }) {
  try {
    const userData = yield select(state => state.user);
    const { userName, isDeputyAvailable: isAvailable } = userData || {};
    const isExternalIDP = yield call(api.app.getIsExternalIDP);
    const config = (yield call(api.menu.getUserCustomMenuConfig, userName)) || {};

    if (!config.items) {
      set(config, 'items', DefaultUserMenu);
    }

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
    console.error('[fetchUserMenu saga] error', e);
  }
}

function* fetchInfluentialParams(api) {
  const isAdmin = yield select(state => state.user.isAdmin);
  const leftMenuEditable = yield select(state => state.app.leftMenuEditable);
  const dashboardEditable = yield select(state => state.app.dashboardEditable);
  const widgetEditable = yield select(state => state.app.widgetEditable);
  const hasWriteCurrentWorkspace = yield call(api.workspaces.hasWriteCurrentWorkspace);

  function* updateWorkspaces() {
    yield put(getSidebarWorkspaces());
  }

  return { isAdmin, dashboardEditable, widgetEditable, leftMenuEditable, hasWriteCurrentWorkspace, updateWorkspaces };
}

function* fetchSiteMenu({ api }) {
  try {
    const params = yield fetchInfluentialParams(api);
    const url = document.location.href;
    const isDashboardPage = isDashboard(url);
    const menuItems = makeSiteMenu({ isDashboardPage, ...params });
    yield put(setSiteMenuItems(menuItems));
  } catch (e) {
    console.error('[fetchSiteMenu saga] error', e);
  }
}

function* filterSiteMenu({ api }, { payload = {} }) {
  try {
    const params = yield fetchInfluentialParams(api);
    const { identification = null } = payload;
    const tabLink = get(payload, 'tab.link', '');
    let { url = window.location.pathname } = payload;

    if (!url && tabLink) {
      url = tabLink;
    }

    if (!url) {
      url = window.location.pathname;
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
    console.error('[filterSiteMenu saga] error', e);
  }
}

function* goToPageSiteMenu({}, { payload }) {
  try {
    const dashboard = yield select(selectIdentificationForView);
    const link = yield MenuService.getSiteMenuLink(payload, dashboard);

    PageService.changeUrlLink(link, { openNewTab: true });
  } catch (e) {
    console.error('[header goToPageSiteMenu saga] error', e);
  }
}

function* sagaRunSearchAutocomplete({ api }, { payload }) {
  try {
    const isAlfrescoEnabled = yield select(state => state.app.isEnabledAlfresco);

    if (isAlfrescoEnabled) {
      const documents = yield api.menu.getLiveSearchDocuments(payload, 0);
      const sites = yield api.menu.getLiveSearchSites(payload);
      const people = yield api.menu.getLiveSearchPeople(payload);
      const noResults = !(!!sites.totalRecords + !!documents.totalRecords + !!people.totalRecords);
      yield put(setSearchAutocompleteItems({ documents, sites, people, noResults }));
    } else {
      const result = yield api.menu.getNewLiveSearch(payload);
      const records = get(result, 'records', []);

      const documents = [];
      const sites = [];
      const people = [];
      const workspaces = [];

      for (const record of records) {
        switch (record.groupType) {
          case LiveSearchTypes.PEOPLE:
            const otherParamsPeople = yield api.menu.getSearchPeopleParams(record.id);
            people.push({ ...record, ...otherParamsPeople, isNotAlfresco: true });

            break;

          case LiveSearchTypes.DOCUMENTS:
            documents.push({
              ...record,
              modifiedOn: get(record, LiveSearchAttributes.MODIFIED),
              nodeRef: get(record, LiveSearchAttributes.ID),
              name: get(record, LiveSearchAttributes.DISP),
              isNotAlfresco: true
            });
            break;

          case LiveSearchTypes.SITES:
            sites.push({
              ...record,
              title: get(record, LiveSearchAttributes.DISP),
              isNotAlfresco: true
            });
            break;

          case LiveSearchTypes.WORKSPACES:
            const otherParamsWorkspaces = yield api.workspaces.getWorkspace(record.id);
            workspaces.push({
              ...record,
              ...otherParamsWorkspaces,
              url: getBaseUrlWorkspace(otherParamsWorkspaces.id, otherParamsWorkspaces.homePageLink),
              description: getMLValue(otherParamsWorkspaces.description),
              title: get(record, LiveSearchAttributes.DISP),
              isNotAlfresco: true
            });
            break;

          default:
            break;
        }
      }

      const noResults = !(!!documents.length + !!sites.length + !!people.length + !!workspaces.length);
      const getObject = arr => ({ items: arr });

      yield put(
        setSearchAutocompleteItems({
          documents: getObject(documents),
          sites: getObject(sites),
          people: getObject(people),
          workspaces: getObject(workspaces),
          noResults
        })
      );
    }
  } catch (e) {
    console.error('[sagaRunSearchAutocomplete saga] error', e);
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
