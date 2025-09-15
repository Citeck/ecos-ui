import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import { call, put, takeLatest, takeEvery, select } from 'redux-saga/effects';

import { getDashboardEditable } from '@/actions/app';
import { getDashboardConfig } from '@/actions/dashboard';
import { getMenuConfig } from '@/actions/menu';
import {
  getWorkspaces,
  goToDefaultFromBlockedWs,
  setWorkspaces,
  setWorkspacesError,
  updateUIWorkspace,
  visitedAction,
  setMyWorkspaces,
  joinToWorkspace,
  setPublicWorkspaces,
  getSidebarWorkspaces,
  setLoadingAction,
  setLoading,
  onSearchWorkspaces,
  setIsBlockedCurrentWorkspace,
  removeWorkspace,
  leaveOfWorkspace
} from '@/actions/workspaces';
import { RecordsQueryResponse } from '@/api/types';
import { WorkspaceType } from '@/api/workspaces/types';
import { URL } from '@/constants';
import { getBaseUrlWorkspace, getLinkWithWs, getPersonalWorkspaceId, getWorkspaceId, getWsIdOfTabLink } from '@/helpers/urls';
import { t } from '@/helpers/util';
import { selectCurrentWorkspaceBlocked, selectCurrentWorkspaceIsBlocked } from '@/selectors/workspaces';
import PageService from '@/services/PageService';
import { NotificationManager } from '@/services/notifications';
import PageTabList from '@/services/pageTabs/PageTabList';
import { ExtraArgumentsStore } from '@/types/store';

function* sagaGetWorkspacesRequest({ api }: ExtraArgumentsStore) {
  try {
    const { records }: RecordsQueryResponse<WorkspaceType> = yield call(api.workspaces.getWorkspaces);

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
    yield put(setLoadingAction(true));

    const selectIsBlockedWorkspace: boolean = yield select(selectCurrentWorkspaceIsBlocked);
    const selectBlockedWorkspace: WorkspaceType = yield select(selectCurrentWorkspaceBlocked);

    const { wsId, callback } = payload;
    yield call(api.workspaces.joinToWorkspace, wsId);
    yield put(getSidebarWorkspaces());

    if (selectIsBlockedWorkspace && selectBlockedWorkspace.id === wsId) {
      const newUrl = getLinkWithWs(URL.DASHBOARD, wsId);
      yield put(setIsBlockedCurrentWorkspace(false));

      PageService.changeUrlLink(newUrl, {
        openNewTab: true,
        needUpdateTabs: true
      });

      yield put(updateUIWorkspace());
      yield put(getDashboardConfig({ key: PageTabList.activeTabId }));
    }

    if (callback) {
      callback();
    }
  } catch (e) {
    console.error('[workspaces/ sagaJoinToWorkspaceRequest] error', e);
    yield put(setWorkspacesError());
    NotificationManager.error(t('workspaces.card.join-workspace.error'));
  } finally {
    yield put(setLoadingAction(false));
  }
}

function* sagaLeaveOfWorkspace({ api }: ExtraArgumentsStore, { payload }: ReturnType<typeof leaveOfWorkspace>) {
  try {
    yield call(api.workspaces.leaveOfWorkspace, payload.wsId);
    yield put(getSidebarWorkspaces());
  } catch (e) {
    console.error('[workspaces/ sagaLeaveOfWorkspace] error', e);
    yield put(setWorkspacesError());
  } finally {
    NotificationManager.success(t('workspaces.card.leave-workspace.success', { wsName: payload.wsName }));
  }
}

function* sagaGoToDefaultFromBlockedWs() {
  try {
    const newUrl = getLinkWithWs(URL.DASHBOARD, getPersonalWorkspaceId());

    yield put(setIsBlockedCurrentWorkspace(false));

    PageService.changeUrlLink(newUrl, { openNewTab: true, needUpdateTabs: true });
  } catch (e) {
    console.error('[workspaces/ sagaGoToDefaultFromBlockedWs] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaUpdateUIWorkspace() {
  try {
    yield put(getDashboardEditable());
    yield put(getMenuConfig());
  } catch (e) {
    console.error('[workspaces/ sagaUpdateUIWorkspace] error', e);
    yield put(setWorkspacesError());
  }
}

function* sagaGetSidebarWorkspaces({ api }: ExtraArgumentsStore) {
  try {
    yield put(setLoading(true));
    const { records: myWorkspaces }: RecordsQueryResponse<WorkspaceType> = yield call(api.workspaces.getMyWorkspaces);
    const { records: publicWorkspaces }: RecordsQueryResponse<WorkspaceType> = yield call(api.workspaces.getPublicWorkspaces);

    yield put(setMyWorkspaces(myWorkspaces));
    yield put(setPublicWorkspaces(publicWorkspaces));
  } catch (e) {
    console.error('[workspaces/ sagaGetSidebarWorkspaces] error', e);
    yield put(setWorkspacesError());
  } finally {
    yield put(setLoading(false));
  }
}

function* sagaOnSearchWorkspaces({ api }: ExtraArgumentsStore, { payload }: ReturnType<typeof onSearchWorkspaces>) {
  try {
    yield put(setLoading(true));
    const { records: myWorkspaces }: RecordsQueryResponse<WorkspaceType> = yield call(api.workspaces.searchMyWorkspaces, payload);
    const { records: publicWorkspaces }: RecordsQueryResponse<WorkspaceType> = yield call(api.workspaces.searchPublicWorkspaces, payload);

    yield put(setMyWorkspaces(myWorkspaces));
    yield put(setPublicWorkspaces(publicWorkspaces));
  } catch (e) {
    console.error('[workspaces/ sagaOnSearchWorkspaces] error', e);
    yield put(setWorkspacesError());
  } finally {
    yield put(setLoading(false));
  }
}

function* sagaRemoveWorkspace({ api }: ExtraArgumentsStore, { payload }: ReturnType<typeof removeWorkspace>) {
  try {
    yield put(setLoadingAction(true));

    const { wsId, callback } = payload;
    const currentWorkspaceId = getWorkspaceId();

    yield call(api.workspaces.removeWorkspace, wsId);

    if (currentWorkspaceId === wsId) {
      const params = {
        openNewTab: true,
        reopen: true,
        closeActiveTab: false,
        needUpdateTabs: true
      };

      const personalWorkspaceId = getPersonalWorkspaceId();
      const url = getBaseUrlWorkspace(personalWorkspaceId);

      PageService.changeUrlLink(url, params);
    }

    yield put(getWorkspaces());
    yield put(getSidebarWorkspaces());

    if (callback) {
      yield call(callback);
    }
  } catch (e) {
    console.error('[workspaces/ sagaRemoveWorkspace] error', e);
    yield put(setWorkspacesError());
  } finally {
    yield put(setLoadingAction(false));
    NotificationManager.success(t('workspaces.card.remove-workspace.success', { wsName: payload.wsName }));
  }
}

function* saga(ea: ExtraArgumentsStore) {
  yield takeLatest(getWorkspaces.toString(), sagaGetWorkspacesRequest, ea);
  yield takeLatest(goToDefaultFromBlockedWs.toString(), sagaGoToDefaultFromBlockedWs, ea);
  yield takeLatest(updateUIWorkspace.toString(), sagaUpdateUIWorkspace, ea);
  yield takeLatest(getSidebarWorkspaces.toString(), sagaGetSidebarWorkspaces, ea);
  yield takeLatest(joinToWorkspace.toString(), sagaJoinToWorkspaceRequest, ea);
  yield takeLatest(leaveOfWorkspace.toString(), sagaLeaveOfWorkspace, ea);
  yield takeLatest(onSearchWorkspaces.toString(), sagaOnSearchWorkspaces, ea);
  yield takeLatest(removeWorkspace.toString(), sagaRemoveWorkspace, ea);
  yield takeEvery(visitedAction.toString(), sagaVisitedActionRequest, ea);
}

export default saga;
