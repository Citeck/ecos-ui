import { createAction } from 'redux-actions';

import { WorkspaceFullType } from '@/api/workspaces/types';

const prefix = 'workspaces/';

export const initWorkspaces = createAction<boolean>(prefix + 'INIT_WORKSPACES');

export const setWorkspaces = createAction<WorkspaceFullType[]>(prefix + 'SET_WORKSPACES');
export const setMyWorkspaces = createAction<WorkspaceFullType[]>(prefix + 'SET_MY_WORKSPACES');
export const setPublicWorkspaces = createAction<WorkspaceFullType[]>(prefix + 'SET_PUBLIC_WORKSPACES');
export const setWorkspacesError = createAction<void>(prefix + 'SET_WORKSPACES_ERROR');
export const setLoadingJoin = createAction<boolean>(prefix + 'SET_LOADING_JOIN');
export const setLoading = createAction<boolean>(prefix + 'SET_LOADING');

export const getWorkspaces = createAction<void>(prefix + 'GET_WORKSPACES');
export const getSidebarWorkspaces = createAction<void>(prefix + 'GET_SIDEBAR_WORKSPACES');

export const onSearchWorkspaces = createAction<string>(prefix + 'ON_SEARCH_WORKSPACES');

export const setDefaultWorkspace = createAction<string>(prefix + 'SET_DEFAULT_WORKSPACE');
export const setBlockedCurrenWorkspace = createAction<boolean>(prefix + 'SET_BLOCKED_CURRENT_WORKSPACE');

export const goToDefaultFromBlockedWs = createAction<void>(prefix + 'GO_TO_DEFAULT_FROM_BLOCKED_WS');
export const updateUIWorkspace = createAction<void>(prefix + 'UPDATE_UI_WORKSPACE');

export const visitedAction = createAction<string>(prefix + 'VISITED_ACTION');
export const joinToWorkspace = createAction<{ wsId: string; callback?: () => void }>(prefix + 'JOIN_TO_WORKSPACE');
