import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import lodashSet from 'lodash/set';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isBoolean from 'lodash/isBoolean';
import isString from 'lodash/isString';
import queryString from 'query-string';

import { URL } from '../constants';
import { getCurrentUserName } from '../helpers/util';
import PageService from '../services/PageService';
import {
  backPageFromTransitionsHistory,
  getAppEdition,
  getDashboardEditable,
  getWidgetEditable,
  getFooter,
  getSeparateActionListForQuery,
  initAppFailure,
  initAppRequest,
  initAppSettings,
  initAppSuccess,
  setAppEdition,
  setDashboardEditable,
  setWidgetEditable,
  setFooter,
  setHomeLink,
  setLeftMenuEditable,
  setRedirectToNewUi,
  setSeparateActionListForQuery
} from '../actions/app';
import { getWorkspaceId } from '../helpers/urls';
import { getWorkspaces, setBlockedCurrenWorkspace, setDefaultWorkspace } from '../actions/workspaces';
import { loadConfigs } from '../services/config/configApi';
import { setNewUIAvailableStatus, validateUserFailure, validateUserSuccess } from '../actions/user';
import { detectMobileDevice, setViewNewJournal } from '../actions/view';
import { getMenuConfig, setMenuConfig } from '../actions/menu';
import { registerEventListeners } from '../actions/customEvent';
import { selectWorkspaces } from '../selectors/workspaces';
import ConfigService, {
  DEFAULT_WORKSPACE,
  WORKSPACES_ENABLED,
  FOOTER_CONTENT,
  HOME_LINK_URL,
  NEW_JOURNAL_ENABLED
} from '../services/config/ConfigService';

export function* initApp({ api, logger }, { payload }) {
  try {
    let isAuthenticated = false;

    try {
      const { query } = queryString.parseUrl(window.location.href);
      const isViewNewJournal = yield ConfigService.getValue(NEW_JOURNAL_ENABLED);

      const resp = yield call(api.user.getUserData);
      const workspaceConfig = yield loadConfigs({
        [DEFAULT_WORKSPACE]: 'value?str',
        [WORKSPACES_ENABLED]: 'value?bool'
      });

      if (get(query, 'ws') && workspaceConfig[WORKSPACES_ENABLED]) {
        const isViewWorkspace = yield call(api.workspaces.isViewWorkspace, query.ws);

        if (isBoolean(isViewWorkspace)) {
          yield put(setBlockedCurrenWorkspace(!isViewWorkspace));
        }
      }

      if (isString(workspaceConfig[DEFAULT_WORKSPACE])) {
        yield put(setDefaultWorkspace(workspaceConfig[DEFAULT_WORKSPACE]));
      }

      if (workspaceConfig[WORKSPACES_ENABLED]) {
        yield put(getWorkspaces());
      }

      if (!resp.success) {
        yield put(validateUserFailure());
      } else {
        isAuthenticated = true;
        yield put(validateUserSuccess(resp.payload));

        // TODO remove in future: see src/helpers/util.js getCurrentUserName()
        lodashSet(window, 'Citeck.constants.USERNAME', get(resp.payload, 'userName'));
        lodashSet(window, 'Citeck.constants.FIRSTNAME', get(resp.payload, 'firstName'));
        lodashSet(window, 'Citeck.navigator.WORKSPACES_ENABLED', workspaceConfig[WORKSPACES_ENABLED]);
        lodashSet(window, 'Citeck.navigator.NEW_JOURNAL_ENABLED', isViewNewJournal);

        if (get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
          lodashSet(window, 'Citeck.navigator.WORKSPACE', getWorkspaceId());
        }
      }

      const isNewUIAvailable = true;

      yield put(setNewUIAvailableStatus(isNewUIAvailable));

      const isForceOldUserDashboardEnabled = yield call(api.app.isForceOldUserDashboardEnabled);

      yield put(setRedirectToNewUi(!isForceOldUserDashboardEnabled));

      const homeLink = yield ConfigService.getValue(HOME_LINK_URL);
      if (isBoolean(isViewNewJournal)) {
        yield put(setViewNewJournal(isViewNewJournal));
      }

      yield put(setHomeLink(homeLink));
    } catch (e) {
      if (e.message === 'User is disabled') {
        alert('User is disabled');
      }
      logger.error('[initApp saga] error inner', e);
      yield put(validateUserFailure());
    }

    yield put(detectMobileDevice());
    yield put(initAppSuccess());

    payload && isFunction(payload.onSuccess) && payload.onSuccess(isAuthenticated);
  } catch (e) {
    logger.error('[app saga] initApp error', e);
    yield put(initAppFailure());
  }
}

export function* fetchAppSettings({ logger }) {
  try {
    yield put(getMenuConfig());
    yield put(getDashboardEditable());
    yield put(getWidgetEditable());
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

    if (get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      const wsId = getWorkspaceId();
      const workspaces = yield select(state => selectWorkspaces(state));

      if (wsId && workspaces && workspaces.length) {
        const currentWs = workspaces.find(ws => ws && ws.wsId && ws.wsId === wsId);

        if (currentWs) {
          yield put(setDashboardEditable(get(currentWs, 'isCurrentUserManager', editable)));
          return;
        }
      }
    }

    yield put(setDashboardEditable(editable));
  } catch (e) {
    logger.error('[app saga] fetchDashboardEditable error', e);
  }
}

export function* fetchWidgetEditable({ api, logger }) {
  try {
    const username = getCurrentUserName();
    const editable = yield call(api.app.isWidgetEditable, { username });

    yield put(setWidgetEditable(editable));
  } catch (e) {
    logger.error('[app saga] fetchWidgetEditable error', e);
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
    const state = yield select();
    const workspaces = selectWorkspaces(state);
    const wsId = getWorkspaceId();

    const isAdmin = get(state, 'user.isAdmin', false);
    const menuVersion = get(state, 'menu.version', 0);
    const workspacesEnabled = get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);

    let isEditable = isAdmin && menuVersion > 0;

    if (workspacesEnabled && wsId) {
      const currentWs = workspaces?.find(ws => ws?.wsId === wsId);
      const isCurrentUserManager = get(currentWs, 'isCurrentUserManager', false);
      isEditable = (isAdmin || isCurrentUserManager) && menuVersion > 0;
    }

    yield put(setLeftMenuEditable(isEditable));
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
    const isShowTabs = yield select(state => get(state, 'pageTabs.isShow'));

    if (!isShowTabs) {
      window.history.length > 1 ? window.history.back() : PageService.changeUrlLink(URL.DASHBOARD);
    } else {
      const location = yield select(state => state.router.location);
      const lenTabs = yield select(state => get(state, 'pageTabs.tabs.length', 0));

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
  yield takeEvery(getWidgetEditable().type, fetchWidgetEditable, ea);
  yield takeEvery(getAppEdition().type, fetchAppEdition, ea);
  yield takeEvery([setMenuConfig().type], fetchLeftMenuEditable, ea);
  yield takeEvery(getFooter().type, fetchFooter, ea);
  yield takeEvery(backPageFromTransitionsHistory().type, sagaBackFromHistory, ea);
  yield takeEvery(validateUserFailure().type, sagaRedirectToLoginPage, ea);
  yield takeEvery(getSeparateActionListForQuery().type, fetchGetSeparateActionListForQuery, ea);
}

export default appSaga;
