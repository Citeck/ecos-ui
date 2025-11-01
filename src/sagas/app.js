import { isError } from 'lodash';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import lodashSet from 'lodash/set';
import queryString from 'query-string';
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';

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
  setSeparateActionListForQuery,
  setAllowToCreateWorkspace
} from '@/actions/app';
import { registerEventListeners } from '@/actions/customEvent';
import { getMenuConfig, setMenuConfig } from '@/actions/menu';
import { setNewUIAvailableStatus, validateUserFailure, validateUserSuccess } from '@/actions/user';
import { detectMobileDevice, setViewNewJournal } from '@/actions/view';
import { getWorkspaces, setBlockedCurrentWorkspace, setDefaultWorkspace } from '@/actions/workspaces';
import { OrgStructApi } from '@/api/orgStruct';
import { SourcesId, URL } from '@/constants';
import { getWorkspaceId } from '@/helpers/urls';
import { getCurrentUserName, getEnabledWorkspaces } from '@/helpers/util';
import { SETTING_ENABLE_VIEW_NEW_JOURNAL } from '@/pages/DevTools/constants';
import { selectWorkspaces } from '@/selectors/workspaces';
import PageService from '@/services/PageService';
import ConfigService, {
  DEFAULT_WORKSPACE,
  WORKSPACES_ENABLED,
  FOOTER_CONTENT,
  HOME_LINK_URL,
  NEW_JOURNAL_ENABLED,
  WORKSPACES_ALLOW_CREATE
} from '@/services/config/ConfigService';
import { loadConfigs } from '@/services/config/configApi';

export function* initApp({ api }, { payload }) {
  try {
    let isAuthenticated = false;
    let hasError = false;

    try {
      const { query } = queryString.parseUrl(window.location.href);

      const userResponse = yield call(api.user.getUserData, OrgStructApi.userAttributes);
      const isAllowToCreateWorkspace = yield call(api.app.getWorkspacesAllowCreateConfig);
      const configs = yield loadConfigs({
        [NEW_JOURNAL_ENABLED]: 'value?bool',
        [DEFAULT_WORKSPACE]: 'value?str',
        [WORKSPACES_ENABLED]: 'value?bool'
      });

      const _isViewNewJournal = configs[NEW_JOURNAL_ENABLED];

      let isViewNewJournal;
      const isViewNewJournalStorage = Boolean(localStorage.getItem(SETTING_ENABLE_VIEW_NEW_JOURNAL));

      switch (true) {
        case isViewNewJournalStorage:
          isViewNewJournal = true;
          break;

        default:
          isViewNewJournal = _isViewNewJournal;
          break;
      }

      if (isBoolean(isAllowToCreateWorkspace)) {
        yield put(setAllowToCreateWorkspace(isAllowToCreateWorkspace));
      }

      if (isBoolean(isViewNewJournal)) {
        yield put(setViewNewJournal(isViewNewJournal));
      }

      if (isString(configs[DEFAULT_WORKSPACE])) {
        yield put(setDefaultWorkspace(configs[DEFAULT_WORKSPACE]));
      }

      if (configs[WORKSPACES_ENABLED]) {
        yield put(getWorkspaces());
      }

      if (!userResponse.success) {
        hasError = true;
        yield put(validateUserFailure());
      } else {
        isAuthenticated = true;
        yield put(validateUserSuccess(userResponse.payload));

        // TODO remove in future: see src/helpers/util.js getCurrentUserName()
        lodashSet(window, 'Citeck.constants.USERNAME', get(userResponse.payload, 'userName'));
        lodashSet(window, 'Citeck.constants.FIRSTNAME', get(userResponse.payload, 'firstName'));
        lodashSet(window, 'Citeck.constants.CURRENT_USER', userResponse.payload);
        lodashSet(window, 'Citeck.navigator.WORKSPACES_ENABLED', configs[WORKSPACES_ENABLED]);
        lodashSet(window, 'Citeck.navigator.DEFAULT_WORKSPACE', configs[DEFAULT_WORKSPACE]);
        lodashSet(window, 'Citeck.constants.NEW_JOURNAL_ENABLED', isViewNewJournal);

        if (get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
          lodashSet(window, 'Citeck.navigator.WORKSPACE', getWorkspaceId());
        }
      }

      if (configs[WORKSPACES_ENABLED]) {
        const wsId = get(query, 'ws') || getWorkspaceId(configs[DEFAULT_WORKSPACE]);
        const workspace = yield call(api.workspaces.getWorkspace, `${SourcesId.WORKSPACE}@${wsId}`);

        if (isBoolean(get(workspace, 'isCurrentUserMember'))) {
          yield put(setBlockedCurrentWorkspace(workspace));
        }
      }

      yield put(setNewUIAvailableStatus(true));

      const isForceOldUserDashboardEnabled = yield call(api.app.isForceOldUserDashboardEnabled);

      if (!hasError) {
        yield put(setRedirectToNewUi(!isForceOldUserDashboardEnabled));

        const homeLink = yield ConfigService.getValue(HOME_LINK_URL);

        yield put(setHomeLink(homeLink));
      }
    } catch (e) {
      if (e.message === 'User is disabled') {
        alert('User is disabled');
      }
      console.error('[initApp saga] error inner', e);
      yield put(validateUserFailure());
    }

    yield put(detectMobileDevice());

    if (hasError) {
      yield put(initAppFailure());
    } else {
      yield put(initAppSuccess());
    }

    payload && isFunction(payload.onRender) && payload.onRender(isAuthenticated);
  } catch (e) {
    console.error('[app saga] initApp error', e);
    yield put(initAppFailure());
  }
}

export function* fetchAppSettings() {
  try {
    yield put(getMenuConfig());
    yield put(getDashboardEditable());
    yield put(getWidgetEditable());
    yield put(getAppEdition());
    yield put(getFooter());
    yield put(getSeparateActionListForQuery());
    yield put(registerEventListeners());
  } catch (e) {
    console.error('[app saga] fetchAppSettings error', e);
  }
}

export function* sagaRedirectToLoginPage({ api }) {
  try {
    const url = yield call(api.app.getLoginPageUrl);

    if (url && url !== window.location.pathname) {
      window.open(url, '_self');
      return;
    }

    if (!url) {
      const reloadCount = parseInt(sessionStorage.getItem('loginRedirectReloadCount') || '0', 10);
      const maxReloadAttempts = 3;

      if (reloadCount < maxReloadAttempts) {
        sessionStorage.setItem('loginRedirectReloadCount', (reloadCount + 1).toString());

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        sessionStorage.removeItem('loginRedirectReloadCount');
        console.error('[app saga] Maximum reload attempts reached. Unable to redirect to login page.');
      }
    }
  } catch (e) {
    console.error('[app saga] sagaRedirectToLoginPage error', e);

    const reloadCount = parseInt(sessionStorage.getItem('loginRedirectReloadCount') || '0', 10);
    const maxReloadAttempts = 3;

    if (reloadCount < maxReloadAttempts) {
      sessionStorage.setItem('loginRedirectReloadCount', (reloadCount + 1).toString());
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      sessionStorage.removeItem('loginRedirectReloadCount');
    }
  }
}

export function* fetchDashboardEditable({ api }) {
  try {
    const username = getCurrentUserName();
    const editable = yield call(api.app.isDashboardEditable, { username });

    if (getEnabledWorkspaces()) {
      const wsId = getWorkspaceId();
      const workspaces = yield select(state => selectWorkspaces(state));

      if (wsId && workspaces && workspaces.length) {
        const currentWs = workspaces.find(ws => ws && ws.id && ws.id === wsId);

        if (currentWs) {
          yield put(setDashboardEditable(get(currentWs, 'isCurrentUserManager') || editable));
          return;
        }
      }
    }

    yield put(setDashboardEditable(editable));
  } catch (e) {
    console.error('[app saga] fetchDashboardEditable error', e);
  }
}

export function* fetchWidgetEditable({ api }) {
  try {
    const username = getCurrentUserName();
    const editable = yield call(api.app.isWidgetEditable, { username });

    yield put(setWidgetEditable(editable));
  } catch (e) {
    console.error('[app saga] fetchWidgetEditable error', e);
  }
}

export function* fetchAppEdition({ api }) {
  try {
    const edition = yield call(api.app.getAppEdition);
    yield put(setAppEdition(edition));
  } catch (e) {
    console.error('[app saga] fetchAppEdition error', e);
  }
}

export function* fetchLeftMenuEditable() {
  try {
    const state = yield select();
    const workspaces = selectWorkspaces(state);
    const wsId = getWorkspaceId();

    const isAdmin = get(state, 'user.isAdmin', false);
    const menuVersion = get(state, 'menu.version', 0);
    const workspacesEnabled = get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);

    let isEditable = isAdmin && menuVersion > 0;

    if (workspacesEnabled && wsId) {
      const currentWs = workspaces?.find(ws => ws?.id === wsId);
      const isCurrentUserManager = get(currentWs, 'isCurrentUserManager', false);
      isEditable = (isAdmin || isCurrentUserManager) && menuVersion > 0;
    }

    yield put(setLeftMenuEditable(isEditable));
  } catch (e) {
    console.error('[app saga] fetchLeftMenuEditable error', e);
  }
}

export function* fetchFooter() {
  try {
    let footer = yield ConfigService.getValue(FOOTER_CONTENT);
    if (footer) {
      yield put(setFooter(footer));
    }
  } catch (e) {
    console.error('[app saga] fetchFooter error', e);
  }
}

function* sagaBackFromHistory() {
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
    console.error('[app saga] sagaBackFromHistory error', e);
  }
}

function* fetchGetSeparateActionListForQuery({ api }) {
  try {
    const flag = yield call(api.app.getSeparateActionListForQuery);
    yield put(setSeparateActionListForQuery(flag));
  } catch (e) {
    console.error('[app saga] fetchGetSeparateActionListForQuery error', e);
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
