import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';

import { URL } from '../constants';
import { getCurrentUserName } from '../helpers/util';
import PageService from '../services/PageService';
import {
  backPageFromTransitionsHistory,
  getAppEdition,
  getDashboardEditable,
  getFooter,
  getSeparateActionListForQuery,
  initAppFailure,
  initAppRequest,
  initAppSettings,
  initAppSuccess,
  setAppEdition,
  setDashboardEditable,
  setFooter,
  setHomeLink,
  setLeftMenuEditable,
  setRedirectToNewUi,
  setSeparateActionListForQuery
} from '../actions/app';
import { setNewUIAvailableStatus, validateUserFailure, validateUserSuccess } from '../actions/user';
import { detectMobileDevice } from '../actions/view';
import { getMenuConfig, setMenuConfig } from '../actions/menu';
import { registerEventListeners } from '../actions/customEvent';
import ConfigService, { FOOTER_CONTENT, HOME_LINK_URL } from '../services/config/ConfigService';

export function* initApp({ api, logger }, { payload }) {
  try {
    // --- Validate user ---
    let isAuthenticated = false;
    try {
      const resp = yield call(api.user.getUserData);

      if (!resp.success) {
        yield put(validateUserFailure());
      } else {
        isAuthenticated = true;
        yield put(validateUserSuccess(resp.payload));

        // TODO remove in future: see src/helpers/util.js getCurrentUserName()
        lodashSet(window, 'Alfresco.constants.USERNAME', lodashGet(resp.payload, 'userName'));
      }

      const isNewUIAvailable = true;

      yield put(setNewUIAvailableStatus(isNewUIAvailable));

      const isForceOldUserDashboardEnabled = yield call(api.app.isForceOldUserDashboardEnabled);

      yield put(setRedirectToNewUi(!isForceOldUserDashboardEnabled));

      const homeLink = yield ConfigService.getValue(HOME_LINK_URL);

      yield put(setHomeLink(homeLink));
    } catch (e) {
      if (e.message === 'User is disabled') {
        alert('User is disabled');
      }
      console.error('[initApp saga] error inner', e);
      yield put(validateUserFailure());
    }

    yield put(detectMobileDevice());
    yield put(initAppSuccess());

    if (payload && payload.onSuccess) {
      typeof payload.onSuccess === 'function' && payload.onSuccess(isAuthenticated);
    }
  } catch (e) {
    logger.error('[app saga] initApp error', e);
    yield put(initAppFailure());
  }
}

export function* fetchAppSettings({ logger }) {
  try {
    yield put(getMenuConfig());
    yield put(getDashboardEditable());
    yield put(getAppEdition());
    yield put(getFooter());
    yield put(getSeparateActionListForQuery());
    yield put(registerEventListeners());
  } catch (e) {
    logger.error('[app saga] fetchAppSettings error', e);
  }
}

export function* sagaRedirectToLoginPage({ api, logger }) {
  try {
    const url = yield call(api.app.getLoginPageUrl);

    if (url && url !== window.location.pathname) {
      window.open(url, '_self');
      return;
    }

    if (!url) {
      window.location.reload();
    }
  } catch (e) {
    logger.error('[app saga] sagaRedirectToLoginPage error', e);
  }
}

export function* fetchDashboardEditable({ api, logger }) {
  try {
    const username = getCurrentUserName();
    const editable = yield call(api.app.isDashboardEditable, { username });

    yield put(setDashboardEditable(editable));
  } catch (e) {
    logger.error('[app saga] fetchDashboardEditable error', e);
  }
}

export function* fetchAppEdition({ api, logger }) {
  try {
    const edition = yield call(api.app.getAppEdition);
    yield put(setAppEdition(edition));
  } catch (e) {
    logger.error('[app saga] fetchAppEdition error', e);
  }
}

export function* fetchLeftMenuEditable({ api, logger }) {
  try {
    const isAdmin = yield select(state => lodashGet(state, 'user.isAdmin', false));
    const menuVersion = yield select(state => lodashGet(state, 'menu.version', 0));

    yield put(setLeftMenuEditable(isAdmin && menuVersion > 0));
  } catch (e) {
    logger.error('[app saga] fetchLeftMenuEditable error', e);
  }
}

export function* fetchFooter({ logger }) {
  try {
    let footer = yield ConfigService.getValue(FOOTER_CONTENT);
    if (footer) {
      yield put(setFooter(footer));
    }
  } catch (e) {
    logger.error('[app saga] fetchFooter error', e);
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
    logger.error('[app saga] sagaBackFromHistory error', e);
  }
}

function* fetchGetSeparateActionListForQuery({ api, logger }) {
  try {
    const flag = yield call(api.app.getSeparateActionListForQuery);
    yield put(setSeparateActionListForQuery(flag));
  } catch (e) {
    logger.error('[app saga] fetchGetSeparateActionListForQuery error', e);
  }
}

function* appSaga(ea) {
  yield takeLatest(initAppRequest().type, initApp, ea);

  yield takeEvery(initAppSettings().type, fetchAppSettings, ea);
  yield takeEvery(getDashboardEditable().type, fetchDashboardEditable, ea);
  yield takeEvery(getAppEdition().type, fetchAppEdition, ea);
  yield takeEvery([setMenuConfig().type], fetchLeftMenuEditable, ea);
  yield takeEvery(getFooter().type, fetchFooter, ea);
  yield takeEvery(backPageFromTransitionsHistory().type, sagaBackFromHistory, ea);
  yield takeEvery(validateUserFailure().type, sagaRedirectToLoginPage, ea);
  yield takeEvery(getSeparateActionListForQuery().type, fetchGetSeparateActionListForQuery, ea);
}

export default appSaga;
