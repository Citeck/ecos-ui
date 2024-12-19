import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';

import { getWorkspaces, setWorkspaces, setWorkspacesError, visitedAction } from '../actions/workspaces';
import { getWsIdOfTabLink } from '../helpers/urls';

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

function* saga(ea) {
  yield takeLatest(getWorkspaces().type, sagaGetWorkspacesRequest, ea);
  yield takeEvery(visitedAction().type, sagaVisitedActionRequest, ea);
}

export default saga;
