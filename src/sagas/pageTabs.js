import { delay } from 'redux-saga';
import { call, put, select, takeLatest, takeEvery } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  getActiveTabTitle,
  getShowTabsStatus,
  getTabs,
  getTabTitle,
  setActiveTabTitle,
  setShowTabsStatus,
  setTabs,
  setTabTitle
} from '../actions/pageTabs';
import { selectTabs } from '../selectors/pageTabs';
import { selectIsAuthenticated } from '../selectors/user';
import Records from '../components/Records';
import { t, deepClone, getCurrentUserName } from '../helpers/util';
import { getSearchParams, isNewVersionPage } from '../helpers/urls';

function* sagaGetShowTabsStatus({ api, logger }, action) {
  try {
    const result = yield call(function() {
      if (!isNewVersionPage()) {
        return Promise.resolve(false);
      }

      return Records.get('uiserv/config@tabs-enabled')
        .load('value?bool')
        .then(value => {
          return value != null ? value : true;
        })
        .catch(e => {
          logger.error('[pageTabs sagaGetShowTabsStatus saga error', e);
          return false;
        });
    }, action.payload);

    yield put(setShowTabsStatus(result));
  } catch (e) {
    logger.error('[pageTabs sagaGetShowTabsStatus saga error', e.message);
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

    const tabs = yield call(api.pageTabs.getAll);

    yield put(setTabs(tabs));
  } catch (e) {
    logger.error('[pageTabs sagaGetTabs saga error', e.message);
  }
}

function* sagaSetTabs({ api, logger }, action) {
  try {
    yield api.pageTabs.set(action.payload);
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

function* sagaGetTabTitle({ api, logger }, { payload }) {
  try {
    if (payload.isActive) {
      yield put(getActiveTabTitle());
    }

    yield delay(1000);
    let tabs = deepClone(yield select(selectTabs));
    const tab = tabs.find(tab => tab.id === payload.tabId);
    const [link] = payload.link.match(/\?.*/gim);
    const { recordRef, nodeRef } = getSearchParams(link);
    let title = t('page-tabs.new-tab');

    if (recordRef || nodeRef) {
      const response = yield api.pageTabs.getTabTitle(recordRef || nodeRef);

      title = get(response, 'displayName', t('page-tabs.new-tab'));
    }

    tab.title = title;
    tab.isLoading = false;
    tabs = deepClone(yield select(selectTabs));

    const index = tabs.findIndex(tab => tab.id === payload.tabId);

    tabs[index] = { ...tabs[index], ...tab };

    yield put(setTabs([...tabs]));
    yield put(setTabTitle(title));
  } catch (e) {
    logger.error('[pageTabs sagaGetTabTitle saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getShowTabsStatus().type, sagaGetShowTabsStatus, ea);
  yield takeLatest(getTabs().type, sagaGetTabs, ea);
  yield takeLatest(setTabs().type, sagaSetTabs, ea);
  yield takeLatest(setActiveTabTitle().type, sagaSetActiveTabTitle, ea);
  yield takeEvery(getTabTitle().type, sagaGetTabTitle, ea);
}

export default saga;
