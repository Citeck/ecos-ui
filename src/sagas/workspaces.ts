import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';

import { fetchCreateCaseWidgetData } from '@/actions/header';
import { getMenuConfig } from '@/actions/menu';
import { fetchSlideMenuItems } from '@/actions/slideMenu';
import {
  getWorkspaces,
  goToDefaultFromBlockedWs,
  setBlockedCurrenWorkspace,
  setWorkspaces,
  setWorkspacesError,
  updateUIWorkspace,
  visitedAction,
  setMyWorkspaces,
  joinToWorkspace,
  setPublicWorkspaces,
  getSidebarWorkspaces,
  setLoadingJoin,
  setLoading,
  onSearchWorkspaces
} from '@/actions/workspaces';
import { RecordsQueryResponse } from '@/api/types';
import { WorkspaceFullType } from '@/api/workspaces/types';
import { URL } from '@/constants';
import { getLinkWithWs, getPersonalWorkspaceId, getWsIdOfTabLink } from '@/helpers/urls';
import { t } from '@/helpers/util';
import PageService from '@/services/PageService';
import { NotificationManager } from '@/services/notifications';
import { ExtraArgumentsStore } from '@/types/store';

function* sagaGetWorkspacesRequest({ api }: ExtraArgumentsStore) {
  try {
    const { records }: RecordsQueryResponse<WorkspaceFullType> = yield call(api.workspaces.getWorkspaces);

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
    console.error('[workspaces/ doGetWorkspacesRequest] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaVisitedActionRequest({ api }: ExtraArgumentsStore, { payload }: ReturnType<typeof visitedAction>) {
  try {
    yield call(api.workspaces.visitedAction, payload);
  } catch (e) {
    console.error('[workspaces/ sagaVisitedActionRequest] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaJoinToWorkspaceRequest({ api }: ExtraArgumentsStore, { payload }: ReturnType<typeof joinToWorkspace>) {
  try {
    yield put(setLoadingJoin(true));
    const { wsId, callback } = payload;
    yield call(api.workspaces.joinToWorkspace, wsId);

    if (callback) {
      callback();
    }
  } catch (e) {
    console.error('[workspaces/ sagaJoinToWorkspaceRequest] error', e);
    yield put(setWorkspacesError());
    NotificationManager.error(t('workspaces.card.join-workspace.error'));
  } finally {
    yield put(setLoadingJoin(false));
  }
}

function* sagaGoToDefaultFromBlockedWs() {
  try {
    const newUrl = getLinkWithWs(URL.DASHBOARD, getPersonalWorkspaceId());

    yield put(setBlockedCurrenWorkspace(false));

    PageService.changeUrlLink(newUrl, { openNewTab: true, needUpdateTabs: true });
  } catch (e) {
    console.error('[workspaces/ sagaGoToDefaultFromBlockedWs] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaUpdateUIWorkspace() {
  try {
    yield put(getMenuConfig());
    yield put(fetchSlideMenuItems());
    yield put(fetchCreateCaseWidgetData());
  } catch (e) {
    console.error('[workspaces/ sagaUpdateUIWorkspace] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaGetSidebarWorkspaces({ api }: ExtraArgumentsStore) {
  try {
    const { records: myWorkspaces }: RecordsQueryResponse<WorkspaceFullType> = yield call(api.workspaces.getMyWorkspaces);
    const { records: publicWorkspaces }: RecordsQueryResponse<WorkspaceFullType> = yield call(api.workspaces.getPublicWorkspaces);

    yield put(setMyWorkspaces(myWorkspaces));
    yield put(setPublicWorkspaces(publicWorkspaces));
  } catch (e) {
    console.error('[workspaces/ sagaGetSidebarWorkspaces] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaOnSearchWorkspaces({ api }: ExtraArgumentsStore, { payload }: ReturnType<typeof onSearchWorkspaces>) {
  try {
    yield put(setLoading(true));
    const { records: myWorkspaces }: RecordsQueryResponse<WorkspaceFullType> = yield call(api.workspaces.searchMyWorkspaces, payload);
    const { records: publicWorkspaces }: RecordsQueryResponse<WorkspaceFullType> = yield call(
      api.workspaces.searchPublicWorkspaces,
      payload
    );

    yield put(setMyWorkspaces(myWorkspaces));
    yield put(setPublicWorkspaces(publicWorkspaces));
  } catch (e) {
    console.error('[workspaces/ sagaOnSearchWorkspaces] error', e);
    yield put(setWorkspacesError());
  } finally {
    yield put(setLoading(false));
  }
}

function* saga(ea: ExtraArgumentsStore) {
  yield takeLatest(getWorkspaces.toString(), sagaGetWorkspacesRequest, ea);
  yield takeLatest(goToDefaultFromBlockedWs.toString(), sagaGoToDefaultFromBlockedWs, ea);
  yield takeLatest(updateUIWorkspace.toString(), sagaUpdateUIWorkspace, ea);
  yield takeLatest(getSidebarWorkspaces.toString(), sagaGetSidebarWorkspaces, ea);
  yield takeLatest(joinToWorkspace.toString(), sagaJoinToWorkspaceRequest, ea);
  yield takeLatest(onSearchWorkspaces.toString(), sagaOnSearchWorkspaces, ea);
  yield takeEvery(visitedAction.toString(), sagaVisitedActionRequest, ea);
}

export default saga;
