import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';

import { URL } from '../constants';
import { selectUserName } from '../selectors/user';
import {
  backPageFromTransitionsHistory,
  getDashboardEditable,
  getFooter,
  initAppFailure,
  initAppRequest,
  initAppSettings,
  initAppSuccess,
  setDashboardEditable,
  setFooter,
  setLeftMenuEditable
} from '../actions/app';
import { validateUserFailure, validateUserSuccess } from '../actions/user';
import { detectMobileDevice } from '../actions/view';
import { getMenuConfig } from '../actions/menu';
import PageService from '../services/PageService';

export function* initApp({ api, fakeApi, logger }, { payload }) {
  try {
    // --- Validate user ---
    let isAuthenticated = false;
    try {
      const checkAuthResp = yield call(api.user.checkIsAuthenticated);
      if (!checkAuthResp.success) {
        yield put(validateUserFailure());
      } else {
        const resp = yield call(api.user.getUserData);
        if (!resp.success) {
          yield put(validateUserFailure());
        } else {
          isAuthenticated = true;
          yield put(validateUserSuccess(resp.payload));

          // TODO remove in future: see src/helpers/util.js getCurrentUserName()
          lodashSet(window, 'Alfresco.constants.USERNAME', lodashGet(resp.payload, 'userName'));
        }
      }
    } catch (e) {
      yield put(validateUserFailure());
    }

    yield put(detectMobileDevice());
    yield put(initAppSuccess());

    if (payload && payload.onSuccess) {
      typeof payload.onSuccess === 'function' && payload.onSuccess(isAuthenticated);
    }
  } catch (e) {
    logger.error('[initApp saga] error', e.message);
    yield put(initAppFailure());
  }
}

export function* fetchAppSettings({ api, fakeApi, logger }, { payload }) {
  try {
    yield put(getMenuConfig());
    yield put(getDashboardEditable());
    yield put(getFooter());
  } catch (e) {
    logger.error('[fetchAppSettings saga] error', e.message);
  }
}

export function* fetchDashboardEditable({ api, logger }) {
  try {
    const username = yield select(selectUserName);
    const editable = yield call(api.app.isDashboardEditable, { username });

    yield put(setDashboardEditable(editable));
    yield put(setLeftMenuEditable(editable)); //todo while there is no own key setting
  } catch (e) {
    logger.error('[fetchDashboardEditable saga] error', e.message);
  }
}

export function* fetchFooter({ api, logger }) {
  try {
    const footer = yield call(api.app.getFooter);

    if (footer) {
      yield put(setFooter(footer));
    }
  } catch (e) {
    logger.error('[fetchFooter saga] error', e.message);
  }
}

function* sagaBackFromHistory({ api, logger }) {
  try {
    const isShowTabs = yield select(state => lodashGet(state, 'pageTabs.isShow'));

    if (!isShowTabs) {
      window.history.length > 1 ? window.history.back() : PageService.changeUrlLink(URL.DASHBOARD);
    } else {
      const location = yield select(state => state.router.location);
      const lenTabs = yield select(state => lodashGet(state, 'pageTabs.tabs.length', 0));

      const subsidiaryLink = location ? location.pathname + location.search : window.location.href;
      const pageUrl = lenTabs > 1 ? '' : PageService.extractWhereLinkOpen({ subsidiaryLink }) || URL.DASHBOARD;

      PageService.changeUrlLink(pageUrl, { reopen: lenTabs <= 1, closeActiveTab: lenTabs > 1 });
    }
  } catch (e) {
    logger.error('[app/page sagaChangeTabData saga error', e.message);
  }
}

function* appSaga(ea) {
  yield takeLatest(initAppRequest().type, initApp, ea);

  yield takeEvery(initAppSettings().type, fetchAppSettings, ea);
  yield takeEvery(getDashboardEditable().type, fetchDashboardEditable, ea);
  yield takeEvery(getFooter().type, fetchFooter, ea);
  yield takeEvery(backPageFromTransitionsHistory().type, sagaBackFromHistory, ea);
}

export default appSaga;
