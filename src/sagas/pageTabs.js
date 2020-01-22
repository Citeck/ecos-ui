import { delay } from 'redux-saga';
import { call, put, select, takeLatest, takeEvery } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  getActiveTabTitle,
  getTabs,
  getTabTitle,
  setActiveTabTitle,
  setShowTabsStatus,
  setTabs,
  initTabs,
  setTabTitle
} from '../actions/pageTabs';
import { selectTabs } from '../selectors/pageTabs';
import { selectIsAuthenticated } from '../selectors/user';
import { t, deepClone, getCurrentUserName } from '../helpers/util';
import { getSearchParams } from '../helpers/urls';
import { URL } from '../constants';
import { TITLE } from '../constants/pageTabs';

function* sagaInitTabs({ api, logger }) {
  try {
    const needShowTabs = yield call(api.pageTabs.getShowStatus);

    if (!needShowTabs) {
      yield put(setShowTabsStatus(needShowTabs));
      return;
    }

    const isAuthorized = yield select(selectIsAuthenticated);

    if (!isAuthorized) {
      return;
    }

    const userName = yield call(getCurrentUserName);

    yield call(api.pageTabs.checkOldVersion, userName);

    let tabs = yield call(api.pageTabs.getAll);

    tabs = yield tabs.map(function*(tab) {
      const newTabData = yield* getTabWithTitle(tab, api);

      return {
        ...tab,
        ...newTabData
      };
    });

    yield put(setTabs(tabs));
    yield put(setShowTabsStatus(needShowTabs));
  } catch (e) {
    logger.error('[pageTabs sagaInitTabs saga error', e.message);
  }
}

function* sagaGetTabs({ api, logger }) {
  try {
    const isAuthorized = yield select(selectIsAuthenticated);

    if (!isAuthorized) {
      return;
    }

    const userName = yield call(getCurrentUserName);

    yield call(api.pageTabs.checkOldVersion, userName);

    let tabs = yield call(api.pageTabs.getAll);

    yield put(setTabs(tabs));
  } catch (e) {
    logger.error('[pageTabs sagaGetTabs saga error', e.message);
  }
}

function* sagaSetTabs({ api, logger }, action) {
  try {
    yield call(api.pageTabs.set, action.payload);
  } catch (e) {
    logger.error('[pageTabs sagaSetTabs saga error', e.message);
  }
}

function* sagaSetActiveTabTitle({ api, logger }, action) {
  try {
    const tabs = deepClone(yield select(selectTabs));
    const activeIndex = tabs.findIndex(tab => tab.isActive);

    if (activeIndex !== -1) {
      tabs[activeIndex].title = action.payload;
    }

    yield put(setTabs(tabs));
  } catch (e) {
    logger.error('[pageTabs sagaSetActiveTabTitle saga error', e.message);
  }
}

function* getTabWithTitle(data, api) {
  try {
    if (data.isActive) {
      yield put(getActiveTabTitle());
    }

    const tab = deepClone(data);
    let title = get(data, 'defaultTitle', t('page-tabs.new-tab'));
    const match = data.link.match(/\?.*/gim);

    if (match) {
      const [link] = match;
      const { recordRef, nodeRef, journalId } = getSearchParams(link);

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
      if (data.link === URL.DASHBOARD) {
        title = t(TITLE.HOMEPAGE);
      }
    }

    tab.title = title;
    tab.isLoading = false;

    if (data.isActive) {
      yield put(setActiveTabTitle());
    }

    return tab;
  } catch (e) {
    console.error(e);
    throw new Error('[pageTabs getTabWithTitle function error');
  }
}

function* sagaGetTabTitle({ api, logger }, { payload }) {
  try {
    yield delay(1000);
    const tab = yield* getTabWithTitle(payload, api);
    const tabs = deepClone(yield select(selectTabs));
    const index = tabs.findIndex(tab => tab.id === payload.tabId);

    tabs[index] = { ...tabs[index], ...tab };

    yield put(setTabs([...tabs]));
    yield put(setTabTitle());
  } catch (e) {
    logger.error('[pageTabs sagaGetTabTitle saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initTabs().type, sagaInitTabs, ea);
  yield takeLatest(getTabs().type, sagaGetTabs, ea);
  yield takeLatest(setTabs().type, sagaSetTabs, ea);
  yield takeLatest(setActiveTabTitle().type, sagaSetActiveTabTitle, ea);
  yield takeEvery(getTabTitle().type, sagaGetTabTitle, ea);
}

export default saga;
