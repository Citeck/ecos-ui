import { delay } from 'redux-saga';
import { put, select, takeEvery } from 'redux-saga/effects';
import get from 'lodash/get';

import { backPageFromTransitionsHistory, changePageData, initPage, reloadPageData, setPageData } from '../actions/webPage';
import PageService from '../services/PageService';
import { URL } from '../constants';

function* sagaReloadPageData({ api, logger }, action) {
  try {
    yield delay(150);
    yield put(setPageData({ stateId: action.payload.stateId, data: action.payload.data }));
  } catch (e) {
    logger.error('[webPage sagaReloadPageData saga error', e.message);
  }
}

function* sagaInitPage({ api, logger }, action) {
  try {
    yield delay(300);
    yield put(setPageData({ stateId: action.payload.stateId, data: action.payload.data }));
  } catch (e) {
    logger.error('[webPage sagaInitPage saga error', e.message);
  }
}

function* sagaBackFromHistory({ api, logger }, { payload }) {
  try {
    const isShowTabs = yield select(state => get(state, 'pageTabs.isShow', false));

    if (!isShowTabs) {
      window.history.length > 1 ? window.history.back() : PageService.changeUrlLink(URL.DASHBOARD);
    } else {
      const location = yield select(state => state.router.location);
      const hasTabs = yield select(state => get(state, 'pageTabs.tabs.length', 0));

      const subsidiaryLink = payload || location ? location.pathname + location.search : window.location.href;
      const pageUrl = !hasTabs ? URL.DASHBOARD : PageService.extractWhereLinkOpen({ subsidiaryLink });
      const params = {};

      if (!pageUrl) {
        params.closeActiveTab = true;
      }

      PageService.changeUrlLink(pageUrl, params);
    }
  } catch (e) {
    logger.error('[webPage sagaChangeTabData saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery([reloadPageData().type, changePageData().type], sagaReloadPageData, ea);
  yield takeEvery(initPage().type, sagaInitPage, ea);
  yield takeEvery(backPageFromTransitionsHistory().type, sagaBackFromHistory, ea);
}

export default saga;
