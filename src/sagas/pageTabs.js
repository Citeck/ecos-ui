import { push } from 'connected-react-router';
import assign from 'lodash/assign';
import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import queryString from 'query-string';
import { call, put, select, takeEvery, takeLatest, all } from 'redux-saga/effects';

import {
  addTab,
  changeTab,
  closeTabs,
  deleteTab,
  getTabs,
  initTabs,
  initTabsComplete,
  moveTabs,
  setDisplayState,
  setShowTabsStatus,
  setTab,
  setTabs,
  updateTab,
  updateTabsFromStorage
} from '@/actions/pageTabs';
import { BASE_URLS_REDIRECT, RELOCATED_URL } from '@/constants';
import { TITLE } from '@/constants/pageTabs';
import { getLinkWithWs, getUrlWithWorkspace, getWorkspaceId, getWsIdOfTabLink } from '@/helpers/urls';
import { getCurrentUserName, getCurrentLocale, getEnabledWorkspaces } from '@/helpers/util';
import { selectInitStatus } from '@/selectors/pageTabs';
import { selectIsAuthenticated } from '@/selectors/user';
import PageService from '@/services/PageService';
import PageTabList from '@/services/pageTabs/PageTabList';

const lng = getCurrentLocale();

function* sagaInitTabs({ api }) {
  try {
    const location = yield select(state => get(state, 'router.location') || {});
    const search = location.search;
    const searchParams = search ? new URLSearchParams(search) : new URLSearchParams();

    const url = location.pathname + search;
    const isAuthorized = yield select(selectIsAuthenticated);
    const displayState = yield call(api.pageTabs.getShowStatus);
    const userName = yield call(getCurrentUserName);

    const enabledWorkspaces = getEnabledWorkspaces();
    const activeUrl = enabledWorkspaces ? getLinkWithWs(url) : url;

    yield put(setShowTabsStatus(displayState));

    if (!isAuthorized || !displayState) {
      return;
    }

    yield call(api.pageTabs.checkOldVersion, userName);

    PageTabList.init({ activeUrl, keyStorage: api.pageTabs.lsKey, displayState });

    yield put(setTabs(PageTabList.storeList));
    yield put(initTabsComplete());

    yield all(
      PageTabList.tabs.map(function* (tab) {
        if (tab.isActive || tab.isLoading) {
          const updates = yield* getTitle(tab);
          PageTabList.changeOne({ tab, updates });
        }
      })
    );

    yield put(setTabs(PageTabList.storeList));

    if (search.includes('ws=') && !searchParams.get('ws') && !BASE_URLS_REDIRECT.includes(location.pathname) && enabledWorkspaces) {
      yield put(push(getUrlWithWorkspace(location.pathname, search, getWorkspaceId())));
    } else if (!url?.includes('ws=') && enabledWorkspaces) {
      // If the old link didn't have a 'ws', then the new one definitely does
      yield put(push(activeUrl));
    }
  } catch (e) {
    console.error('[pageTabs] sagaInitTabs saga error', e);
  }
}

function* sagaGetTabs({ api }, action) {
  try {
    const inited = yield select(selectInitStatus);
    const isAuthorized = yield select(selectIsAuthenticated);
    const { force } = action.payload || {};

    if (!inited || !isAuthorized) {
      return;
    }

    if (!!PageTabList.tabs.length && !force) {
      return PageTabList.tabs;
    }

    yield put(initTabs());
  } catch (e) {
    console.error('[pageTabs] sagaGetTabs saga error', e);
  }
}

function sagaSetDisplayState({ api }, { payload }) {
  try {
    PageTabList.displayState = payload;
  } catch (e) {
    console.error('[pageTabs] sagaSetDisplayState saga error', e);
  }
}

function* sagaMoveTabs({ api }, action) {
  try {
    const { indexFrom, indexTo } = action.payload;

    PageTabList.move(indexFrom, indexTo);
    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    console.error('[pageTabs] sagaMoveTabs saga error', e);
  }
}

function* sagaSetOneTab({ api }, { payload }) {
  try {
    const { data: dataTab, params } = payload;
    const { closeActiveTab } = params || {};
    const enabledWorkspaces = getEnabledWorkspaces();

    const urlLocation = new URL(dataTab.link, window.location.origin);
    if (enabledWorkspaces && Object.keys(RELOCATED_URL).includes(urlLocation.pathname)) {
      dataTab.link = RELOCATED_URL[urlLocation.pathname] + urlLocation.search;
    }

    if (closeActiveTab) {
      yield put(deleteTab(PageTabList.activeTab));
    }

    if (!dataTab || !dataTab.link) {
      return;
    }

    if (dataTab.needUpdateTabs && dataTab.link) {
      yield put(push(dataTab.link));
      yield put(setTabs(PageTabList.storeList));
    }

    if (enabledWorkspaces) {
      const workspace = getWorkspaceId();

      if (workspace) {
        params.workspace = workspace;
        dataTab.workspace = workspace;
      }

      if (dataTab && dataTab.link && !getWsIdOfTabLink(dataTab.link)) {
        dataTab.link = getLinkWithWs(dataTab.link, workspace);
      }
    }

    const tab = PageTabList.setTab(dataTab, params);

    if (tab.isActive && tab.link && !dataTab.needUpdateTabs) {
      yield put(push(tab.link));
    }

    yield put(setTabs(PageTabList.storeList));
    const data = yield* getTitle(tab);

    yield put(changeTab({ data, tab }));
  } catch (e) {
    console.error('[pageTabs] sagaSetTab saga error', e);
  }
}

function* sagaAddOneTab({ api }, { payload }) {
  try {
    const { data: dataTab, params } = payload;
    const { workspaceId } = params || {};

    if (!dataTab || !dataTab.link) {
      return;
    }

    if (getEnabledWorkspaces()) {
      const workspace = workspaceId || getWorkspaceId();

      if (workspace) {
        params.workspace = workspace;
      }

      if (dataTab && dataTab.link && !getWsIdOfTabLink(dataTab.link)) {
        dataTab.link = getLinkWithWs(dataTab.link, workspace);
      }
    }

    const data = yield* getTitle({ link: dataTab.link });
    const tab = PageTabList.setTab({ ...dataTab, ...data }, params);

    const intermediatePage = PageTabList.storeList.find(tab => BASE_URLS_REDIRECT.includes(tab.link));
    if (intermediatePage) {
      yield put(deleteTab(intermediatePage));
    }

    if (tab.isActive && tab.link) {
      yield put(push(tab.link));
    }

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    console.error('[pageTabs] sagaAddOneTab saga error', e);
  }
}

function* sagaDeleteTab({ api }, action) {
  try {
    const activePrev = PageTabList.activeTab;
    const deletedTab = PageTabList.delete(action.payload);
    const tab = PageTabList.activeTab;
    const updates = !deletedTab || PageTabList.equals(activePrev, tab) ? {} : { isActive: true };

    deletedTab && PageService.extractWhereLinkOpen({ subsidiaryLink: deletedTab.link });
    yield put(changeTab({ tab, updates }));
  } catch (e) {
    console.error('[pageTabs] sagaDeleteTab saga error', e);
  }
}

function* sagaCloseTabs({ api }, { payload }) {
  try {
    const { tabs, homepageLink, tab } = payload;
    const wsId = getWorkspaceId();

    PageTabList.delete(tabs);

    if (
      homepageLink &&
      isEmpty(
        (PageTabList.tabs || []).filter(tab => !get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false) || get(tab, 'workspace') === wsId)
      )
    ) {
      PageService.changeUrlLink(homepageLink, { openNewTab: true });
    }

    if (tab && !tab.isActive && !PageTabList.hasActiveTab) {
      PageTabList.activate(tab);
      PageService.changeUrlLink(tab.link, { openNewTab: true });
    }

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    console.error('[pageTabs] sagaCloseTabs saga error', e);
  }
}

function* sagaChangeTabData({ api }, { payload }) {
  try {
    const inited = yield select(selectInitStatus);

    if (!inited) {
      return;
    }

    let updates = assign(payload.data, payload.updates);
    const tab = payload.tab || find(PageTabList.tabs, payload.filter);

    if (updates.isActive) {
      const title = yield getTitle(tab);
      updates = { ...updates, ...title };
    }

    PageTabList.changeOne({ tab, updates });

    if (updates.isActive) {
      yield put(push(tab.link));
    }

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    console.error('[pageTabs] sagaChangeTabData saga error', e);
  }
}

function* sagaUpdateTabData({ api }, { payload }) {
  try {
    const inited = yield select(selectInitStatus);

    if (!inited) {
      return;
    }

    const updatingPayload = get(payload, 'updates', {});
    let tab = get(payload, 'tab');

    if (getEnabledWorkspaces() && updatingPayload && updatingPayload.link && !getWsIdOfTabLink(updatingPayload.link)) {
      updatingPayload.link = getLinkWithWs(updatingPayload.link, get(PageTabList.activeTab, 'workspace', getWorkspaceId()));
    }

    if (!tab) {
      tab = PageTabList.changeOne({
        tab: PageTabList.activeTab,
        updates: updatingPayload
      });
    }

    if (tab.link && !tab.link.includes('activeTab')) {
      if (get(updatingPayload, 'link') !== get(tab, 'link')) {
        PageTabList.changeOne({ tab, updates: { ...updatingPayload, title: undefined, isLoading: true } });
      } else {
        PageTabList.changeOne({ tab, updates: { ...updatingPayload } });
      }

      yield put(setTabs(PageTabList.storeList));
    }

    const updates = yield* getTitle(tab);

    PageTabList.changeOne({ tab, updates: { ...updatingPayload, ...updates } });

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    console.error('[pageTabs] sagaUpdateTabData saga error', e);
  }
}

function* sagaUpdateTabs() {
  try {
    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    console.error('[pageTabs] sagaUpdateTabs saga error', e);
  }
}

function* getTitle(tab) {
  try {
    const urlProps = queryString.parseUrl(tab.link);
    const { recordRef: ref, nodeRef, dashboardId, journalId, type } = urlProps.query || {};
    const recordRef = ref || nodeRef;
    const title = yield PageService.getPage(tab).getTitle({ recordRef, dashboardId, journalId, type }, tab.link);

    return {
      title: {
        [lng]: title
      },
      isLoading: false
    };
  } catch (e) {
    console.error('[pageTabs] getTitle]', e);
    return {
      title: {
        [lng]: TITLE.NO_NAME
      },
      isLoading: false
    };
  }
}

function* saga(ea) {
  yield takeLatest(initTabs().type, sagaInitTabs, ea);
  yield takeLatest(getTabs().type, sagaGetTabs, ea);
  yield takeEvery(setDisplayState().type, sagaSetDisplayState, ea);
  yield takeEvery(moveTabs().type, sagaMoveTabs, ea);
  yield takeEvery(setTab().type, sagaSetOneTab, ea);
  yield takeEvery(addTab().type, sagaAddOneTab, ea);
  yield takeEvery(deleteTab().type, sagaDeleteTab, ea);
  yield takeEvery(closeTabs().type, sagaCloseTabs, ea);
  yield takeLatest(changeTab().type, sagaChangeTabData, ea);
  yield takeEvery(updateTab().type, sagaUpdateTabData, ea);
  yield takeEvery(updateTabsFromStorage().type, sagaUpdateTabs, ea);
}

export default saga;
