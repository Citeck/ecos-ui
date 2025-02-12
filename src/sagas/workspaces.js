import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';

import {
  getWorkspaces,
  goToDefaultFromBlockedWs,
  setBlockedCurrenWorkspace,
  setWorkspaces,
  setWorkspacesError,
  updateUIWorkspace,
  visitedAction
} from '../actions/workspaces';
import { getLinkWithWs, getPersonalWorkspaceId, getWsIdOfTabLink } from '../helpers/urls';
import PageService from '../services/PageService';
import { URL } from '../constants';
import { fetchSlideMenuItems } from '../actions/slideMenu';
import { fetchCreateCaseWidgetData } from '../actions/header';
import { getMenuConfig } from '../actions/menu';

function* sagaGetWorkspacesRequest({ api, logger }) {
  try {
    const { records } = yield call(api.workspaces.getWorkspaces);

    const resolveRecords = (records || []).map(record => {
      const homePageLink = get(record, 'homePageLink');
      const isCurrentUserManager = get(record, 'isCurrentUserManager');

      if (isBoolean(isCurrentUserManager)) {
        record.isCurrentUserManager = isCurrentUserManager;
      }

      if (homePageLink) {
        const wsId = getWsIdOfTabLink(homePageLink);

        if (wsId) {
          switch (true) {
            case homePageLink.includes(`?ws=${wsId}`):
              record.homePageLink = homePageLink.replace(`?ws=${wsId}`, '');
              break;

            case homePageLink.includes(`&ws=${wsId}`):
              record.homePageLink = homePageLink.replace(`&ws=${wsId}`, '');
              break;

            default:
              break;
          }
        }
      }

      return record;
    });

    if (resolveRecords) {
      yield put(setWorkspaces(records));
    }
  } catch (e) {
    logger.error('[workspaces/ doGetWorkspacesRequest] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaVisitedActionRequest({ api, logger }, { payload }) {
  try {
    yield call(api.workspaces.visitedAction, payload);
  } catch (e) {
    logger.error('[workspaces/ sagaVisitedActionRequest] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaGoToDefaultFromBlockedWs({ logger }) {
  try {
    const newUrl = getLinkWithWs(URL.DASHBOARD, getPersonalWorkspaceId());

    yield put(setBlockedCurrenWorkspace(false));

    PageService.changeUrlLink(newUrl, { openNewTab: true, needUpdateTabs: true });
  } catch (e) {
    logger.error('[workspaces/ sagaGoToDefaultFromBlockedWs] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaUpdateUIWorkspace({ logger }) {
  try {
    yield put(getMenuConfig());
    yield put(fetchSlideMenuItems());
    yield put(fetchCreateCaseWidgetData());
  } catch (e) {
    logger.error('[workspaces/ sagaUpdateUIWorkspace] error', e);
    yield put(setWorkspacesError());
  }
}

function* saga(ea) {
  yield takeLatest(getWorkspaces().type, sagaGetWorkspacesRequest, ea);
  yield takeLatest(goToDefaultFromBlockedWs().type, sagaGoToDefaultFromBlockedWs, ea);
  yield takeLatest(updateUIWorkspace().type, sagaUpdateUIWorkspace, ea);
  yield takeEvery(visitedAction().type, sagaVisitedActionRequest, ea);
}

export default saga;
