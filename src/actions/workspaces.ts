import { createAction } from 'redux-actions';

import { WorkspaceType } from '@/api/workspaces/types';

const prefix = 'workspaces/';

export const initWorkspaces = createAction<boolean>(prefix + 'INIT_WORKSPACES');

export const setWorkspaces = createAction<WorkspaceType[]>(prefix + 'SET_WORKSPACES');
export const setMyWorkspaces = createAction<WorkspaceType[]>(prefix + 'SET_MY_WORKSPACES');
export const setPublicWorkspaces = createAction<WorkspaceType[]>(prefix + 'SET_PUBLIC_WORKSPACES');
export const setWorkspacesError = createAction<void>(prefix + 'SET_WORKSPACES_ERROR');
export const setLoadingAction = createAction<boolean>(prefix + 'SET_LOADING_ACTION');
export const setLoading = createAction<boolean>(prefix + 'SET_LOADING');

export const getWorkspaces = createAction<void>(prefix + 'GET_WORKSPACES');
export const getSidebarWorkspaces = createAction<void>(prefix + 'GET_SIDEBAR_WORKSPACES');

export const onSearchWorkspaces = createAction<string>(prefix + 'ON_SEARCH_WORKSPACES');
export const removeWorkspace = createAction<{ wsId: WorkspaceType['id']; callback?: () => void }>(prefix + 'REMOVE_WORKSPACE');

export const setDefaultWorkspace = createAction<WorkspaceType['id']>(prefix + 'SET_DEFAULT_WORKSPACE');
export const setIsBlockedCurrentWorkspace = createAction<boolean>(prefix + 'SET_IS_BLOCKED_CURRENT_WORKSPACE');
export const setBlockedCurrentWorkspace = createAction<WorkspaceType>(prefix + 'SET_BLOCKED_CURRENT_WORKSPACE');

export const goToDefaultFromBlockedWs = createAction<void>(prefix + 'GO_TO_DEFAULT_FROM_BLOCKED_WS');
export const updateUIWorkspace = createAction<void>(prefix + 'UPDATE_UI_WORKSPACE');

export const visitedAction = createAction<WorkspaceType['id']>(prefix + 'VISITED_ACTION');
export const joinToWorkspace = createAction<{ wsId: WorkspaceType['id']; callback?: () => void }>(prefix + 'JOIN_TO_WORKSPACE');
export const leaveOfWorkspace = createAction<{ wsId: WorkspaceType['id']; wsName: WorkspaceType['name'] }>(prefix + 'LEAVE_OF_WORKSPACE');
