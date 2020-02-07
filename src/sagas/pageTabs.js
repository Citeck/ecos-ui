import { delay } from 'redux-saga';
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import queryString from 'query-string';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
  getTabs,
  getTabTitle,
  initTabs,
  initTabsComplete,
  setActiveTabTitle,
  setLocalTabs,
  setShowTabsStatus,
  setTabs,
  setTabTitle
} from '../actions/pageTabs';
import { selectInitStatus, selectTabs } from '../selectors/pageTabs';
import { selectIsAuthenticated } from '../selectors/user';
import { deepClone, getCurrentUserName, t } from '../helpers/util';
import { URL } from '../constants';
import { TITLE } from '../constants/pageTabs';
import PageTabList from '../services/pageTabs/PageTabListService';

function* sagaInitTabs({ api, logger }) {
  try {
    const location = yield select(state => state.router.location);
    const initUrl = location.pathname + location.search;
    const isAuthorized = yield select(selectIsAuthenticated);
    const needShowTabs = yield call(api.pageTabs.getShowStatus);
    const userName = yield call(getCurrentUserName);

    yield put(setShowTabsStatus(needShowTabs));

    if (!isAuthorized || !needShowTabs) {
      return;
    }

    yield call(api.pageTabs.checkOldVersion, userName);

    const storageTabs = yield call(api.pageTabs.getAll);

    PageTabList.init({ tabs: storageTabs, params: { initUrl } });

    yield put(setLocalTabs({ tabs: PageTabList.tabs }));
    yield put(initTabsComplete());

    const initTabs = deepClone(PageTabList.tabs);
    const tabs = yield initTabs.map(function*(tab) {
      const data = yield* getTabWithTitle({ api, logger }, { payload: tab });

      return {
        ...tab,
        ...data
      };
    });

    yield put(setLocalTabs({ tabs }));
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

function* sagaSetTabs({ api, logger }, action) {
  try {
    PageTabList.tabs = action.payload || {};

    yield put(setTabs(PageTabList.tabs));

    const inited = yield select(selectInitStatus);

    if (!inited || !action.payload) {
      return;
    }

    yield call(api.pageTabs.set, PageTabList.storageList);
  } catch (e) {
    logger.error('[pageTabs sagaSetTabs saga error', e.message);
  }
}

function* sagaSetActiveTabTitle({ api, logger }, action) {
  try {
    const inited = yield select(selectInitStatus);

    if (!inited) {
      return;
    }

    const tabs = deepClone(yield select(selectTabs));
    const activeIndex = tabs.findIndex(tab => tab.isActive);

    if (activeIndex !== -1) {
      tabs[activeIndex].title = action.payload;
      tabs[activeIndex].isLoading = false;
    }

    yield put(setTabs(tabs));
  } catch (e) {
    logger.error('[pageTabs sagaSetActiveTabTitle saga error', e.message);
  }
}

function* getTabWithTitle({ api, logger }, action) {
  try {
    const data = action.payload;
    const tab = {};
    const urlProps = queryString.parseUrl(data.link);

    let title = get(data, 'defaultTitle', t('page-tabs.new-tab'));

    if (!isEmpty(urlProps.query)) {
      const { recordRef, nodeRef, journalId } = urlProps.query;

      if (recordRef || nodeRef) {
        const response = yield call(api.pageTabs.getTabTitle, { recordRef: recordRef || nodeRef });

        title = get(response, 'displayName', t('page-tabs.new-tab'));
      }

      if (journalId) {
        const journalTitle = yield call(api.pageTabs.getTabTitle, { journalId });

        if (journalTitle) {
          title = `${t('journal.title')} "${journalTitle}"`;
        }
      }
    } else {
      title = t(get(TITLE, data.link, TITLE.HOMEPAGE));

      if (data.link === URL.DASHBOARD) {
        title = t(TITLE.HOMEPAGE);
      }
    }

    tab.title = title;
    tab.isLoading = false;

    return tab;
  } catch (e) {
    console.error(e);
    throw new Error('[pageTabs getTabWithTitle function error');
  }
}

function* sagaGetTabTitle({ api, logger }, { payload }) {
  try {
    const inited = yield select(selectInitStatus);

    if (!inited) {
      return;
    }

    yield delay(1000);
    const tab = yield* getTabWithTitle({ api, logger }, { payload });
    const tabs = deepClone(yield select(selectTabs));
    const index = tabs.findIndex(tab => tab.id === payload.tabId);

    tabs[index] = { ...tabs[index], title: tab.title, isLoading: tab.isLoading };

    yield put(setTabs([...tabs]));
    yield put(setTabTitle());
  } catch (e) {
    logger.error('[pageTabs sagaGetTabTitle saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initTabs().type, sagaInitTabs, ea);
  yield takeLatest(getTabs().type, sagaGetTabs, ea);
  yield takeLatest(setLocalTabs().type, sagaSetTabs, ea);
  yield takeLatest(setActiveTabTitle().type, sagaSetActiveTabTitle, ea);
  yield takeEvery(getTabTitle().type, sagaGetTabTitle, ea);
}

export default saga;
