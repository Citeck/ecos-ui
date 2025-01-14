import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import queryString from 'query-string';
import find from 'lodash/find';
import get from 'lodash/get';
import assign from 'lodash/assign';
import isEmpty from 'lodash/isEmpty';

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
} from '../actions/pageTabs';
import { selectInitStatus } from '../selectors/pageTabs';
import { selectIsAuthenticated } from '../selectors/user';
import { getCurrentUserName, getCurrentLocale } from '../helpers/util';
import PageTabList from '../services/pageTabs/PageTabList';
import PageService from '../services/PageService';
import { TITLE } from '../constants/pageTabs';
import { getWorkspaceId, getWsIdOfTabLink } from '../helpers/urls';
import { BASE_URLS_REDIRECT, RELOCATED_URL } from '../constants';

const lng = getCurrentLocale();

function* sagaInitTabs({ api, logger }) {
  try {
    const location = yield select(state => get(state, 'router.location') || {});
    const activeUrl = location.pathname + location.search;
    const isAuthorized = yield select(selectIsAuthenticated);
    const displayState = yield call(api.pageTabs.getShowStatus);
    const userName = yield call(getCurrentUserName);

    yield put(setShowTabsStatus(displayState));

    if (!isAuthorized || !displayState) {
      return;
    }

    yield call(api.pageTabs.checkOldVersion, userName);

    PageTabList.init({ activeUrl, keyStorage: api.pageTabs.lsKey, displayState });

    yield put(setTabs(PageTabList.storeList));
    yield put(initTabsComplete());

    yield PageTabList.tabs.map(function*(tab) {
      if (tab.isActive || tab.isLoading) {
        const updates = yield* getTitle(tab);
        PageTabList.changeOne({ tab, updates });
      }
    });

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs] sagaInitTabs saga error', e);
  }
}

function* sagaGetTabs({ api, logger }, action) {
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
    logger.error('[pageTabs] sagaGetTabs saga error', e);
  }
}

function sagaSetDisplayState({ api, logger }, { payload }) {
  try {
    PageTabList.displayState = payload;
  } catch (e) {
    logger.error('[pageTabs] sagaSetDisplayState saga error', e);
  }
}

function* sagaMoveTabs({ api, logger }, action) {
  try {
    const { indexFrom, indexTo } = action.payload;

    PageTabList.move(indexFrom, indexTo);
    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs] sagaMoveTabs saga error', e);
  }
}

function* sagaSetOneTab({ api, logger }, { payload }) {
  try {
    const { data: dataTab, params } = payload;
    const { closeActiveTab } = params || {};

    const urlLocation = new URL(dataTab.link, window.location.origin);

    if (Object.keys(RELOCATED_URL).includes(urlLocation.pathname)) {
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

    if (get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      const workspace = getWorkspaceId();

      if (workspace) {
        params.workspace = workspace;
      }

      if (dataTab && dataTab.link && !getWsIdOfTabLink(dataTab.link)) {
        dataTab.link += '&ws=' + workspace;
      }
    }

    const tab = PageTabList.setTab(dataTab, params);

    if (tab.isActive && tab.link) {
      yield put(push(tab.link));
    }

    yield put(setTabs(PageTabList.storeList));
    const data = yield* getTitle(tab);

    yield put(changeTab({ data, tab }));
  } catch (e) {
    logger.error('[pageTabs] sagaSetTab saga error', e);
  }
}

function* sagaAddOneTab({ api, logger }, { payload }) {
  try {
    const { data: dataTab, params } = payload;
    const { workspaceId } = params || {};

    if (!dataTab || !dataTab.link) {
      return;
    }

    if (get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      const workspace = workspaceId || getWorkspaceId();

      if (workspace) {
        params.workspace = workspace;
      }

      if (dataTab && dataTab.link && !getWsIdOfTabLink(dataTab.link)) {
        dataTab.link += '&ws=' + workspace;
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
    logger.error('[pageTabs] sagaAddOneTab saga error', e);
  }
}

function* sagaDeleteTab({ api, logger }, action) {
  try {
    const activePrev = PageTabList.activeTab;
    const deletedTab = PageTabList.delete(action.payload);
    const tab = PageTabList.activeTab;
    const updates = !deletedTab || PageTabList.equals(activePrev, tab) ? {} : { isActive: true };

    deletedTab && PageService.extractWhereLinkOpen({ subsidiaryLink: deletedTab.link });
    yield put(changeTab({ tab, updates }));
  } catch (e) {
    logger.error('[pageTabs] sagaDeleteTab saga error', e);
  }
}

function* sagaCloseTabs({ api, logger }, { payload }) {
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
    logger.error('[pageTabs] sagaCloseTabs saga error', e);
  }
}

function* sagaChangeTabData({ api, logger }, { payload }) {
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
    logger.error('[pageTabs] sagaChangeTabData saga error', e);
  }
}

function* sagaUpdateTabData({ api, logger }, { payload }) {
  try {
    const inited = yield select(selectInitStatus);

    if (!inited) {
      return;
    }

    const updatingPayload = get(payload, 'updates', {});
    let tab = get(payload, 'tab');

    if (
      get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false) &&
      updatingPayload &&
      updatingPayload.link &&
      !getWsIdOfTabLink(updatingPayload.link)
    ) {
      updatingPayload.link += '&ws=' + get(PageTabList.activeTab, 'workspace', getWorkspaceId());
    }

    if (!tab) {
      tab = PageTabList.changeOne({
        tab: PageTabList.activeTab,
        updates: updatingPayload
      });
    }

    if (tab.link && !tab.link.includes('activeTab')) {
      PageTabList.changeOne({ tab, updates: { ...updatingPayload, title: undefined, isLoading: true } });
      yield put(setTabs(PageTabList.storeList));
    }

    const updates = yield* getTitle(tab);

    PageTabList.changeOne({ tab, updates: { ...updatingPayload, ...updates } });

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs] sagaUpdateTabData saga error', e);
  }
}

function* sagaUpdateTabs({ api, logger }, { payload }) {
  try {
    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs] sagaUpdateTabs saga error', e);
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
  yield takeEvery(changeTab().type, sagaChangeTabData, ea);
  yield takeEvery(updateTab().type, sagaUpdateTabData, ea);
  yield takeEvery(updateTabsFromStorage().type, sagaUpdateTabs, ea);
}

export default saga;
