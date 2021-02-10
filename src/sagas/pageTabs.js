import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import queryString from 'query-string';
import find from 'lodash/find';
import get from 'lodash/get';
import assign from 'lodash/assign';

import {
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
import { getCurrentUserName } from '../helpers/util';
import PageTabList from '../services/pageTabs/PageTabList';
import PageService from '../services/PageService';
import { TITLE } from '../constants/pageTabs';

function* sagaInitTabs({ api, logger }) {
  try {
    const location = yield select(state => state.router.location);
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
      const updates = yield* getTitle(tab);
      PageTabList.changeOne({ tab, updates });
    });

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaInitTabs saga error', e.message);
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
    logger.error('[pageTabs sagaGetTabs saga error', e.message);
  }
}

function sagaSetDisplayState({ api, logger }, { payload }) {
  try {
    PageTabList.displayState = payload;
  } catch (e) {
    logger.error('[pageTabs sagaSetDisplayState saga error', e.message);
  }
}

function* sagaMoveTabs({ api, logger }, action) {
  try {
    const { indexFrom, indexTo } = action.payload;

    PageTabList.move(indexFrom, indexTo);
    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaMoveTabs saga error', e.message);
  }
}

function* sagaSetOneTab({ api, logger }, { payload }) {
  try {
    const { data: dataTab, params } = payload;
    const { closeActiveTab } = params || {};

    if (closeActiveTab) {
      yield put(deleteTab(PageTabList.activeTab));
    }

    if (!dataTab || !dataTab.link) {
      return;
    }

    const tab = PageTabList.setTab(dataTab, params);

    if (tab.isActive && tab.link) {
      yield put(push(tab.link));
    }

    yield put(setTabs(PageTabList.storeList));
    const data = yield* getTitle(tab);

    yield put(changeTab({ data, tab }));
  } catch (e) {
    logger.error('[pageTabs sagaSetTab saga error', e.message);
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
    logger.error('[pageTabs sagaDeleteTab saga error', e.message);
  }
}

function* sagaCloseTabs({ api, logger }, { payload }) {
  try {
    const { tabs, homepageLink } = payload;

    PageTabList.delete(tabs);

    if (homepageLink) {
      PageService.changeUrlLink(homepageLink, { openNewTab: true });
    }

    yield put(setTabs(PageTabList.tabs, { reopen: true }));
  } catch (e) {
    logger.error('[pageTabs sagaCloseTabs saga error', e.message);
  }
}

function* sagaChangeTabData({ api, logger }, { payload }) {
  try {
    const inited = yield select(selectInitStatus);

    if (!inited) {
      return;
    }

    const updates = assign(payload.data, payload.updates);
    const tab = payload.tab || find(PageTabList.tabs, payload.filter);

    PageTabList.changeOne({ tab, updates });

    if (updates.isActive) {
      yield put(push(tab.link));
    }

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaChangeTabData saga error', e.message);
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

    if (!tab) {
      tab = PageTabList.changeOne({
        tab: PageTabList.activeTab,
        updates: updatingPayload
      });
    }

    const updates = yield* getTitle(tab);

    PageTabList.changeOne({ tab, updates: { ...updatingPayload, ...updates } });

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaUpdateTabData saga error', e.message);
  }
}

function* sagaUpdateTabs({ api, logger }, { payload }) {
  try {
    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaUpdateTabs saga error', e.message);
  }
}

function* getTitle(tab) {
  try {
    const urlProps = queryString.parseUrl(tab.link);
    const { recordRef: ref, nodeRef, journalId } = urlProps.query || {};
    const recordRef = ref || nodeRef;
    const title = yield PageService.getPage(tab).getTitle({ recordRef, journalId }, tab.link);

    return {
      title,
      isLoading: false
    };
  } catch (e) {
    console.error('[getTitle]', e);
    return {
      title: TITLE.NO_NAME,
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
  yield takeEvery(deleteTab().type, sagaDeleteTab, ea);
  yield takeEvery(closeTabs().type, sagaCloseTabs, ea);
  yield takeEvery(changeTab().type, sagaChangeTabData, ea);
  yield takeEvery(updateTab().type, sagaUpdateTabData, ea);
  yield takeEvery(updateTabsFromStorage().type, sagaUpdateTabs, ea);
}

export default saga;
