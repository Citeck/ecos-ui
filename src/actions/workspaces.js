import { createAction } from 'redux-actions';

const prefix = 'workspaces/';

export const initWorkspaces = createAction(prefix + 'INIT_WORKSPACES');
export const setWorkspaces = createAction(prefix + 'SET_WORKSPACES');
export const setWorkspacesError = createAction(prefix + 'SET_WORKSPACES_ERROR');
export const getWorkspaces = createAction(prefix + 'GET_WORKSPACES');

export const setDefaultWorkspace = createAction(prefix + 'SET_DEFAULT_WORKSPACE');
export const setBlockedCurrenWorkspace = createAction(prefix + 'SET_BLOCKED_CURRENT_WORKSPACE');

export const goToDefaultFromBlockedWs = createAction(prefix + 'GO_TO_DEFAULT_FROM_BLOCKED_WS');
export const updateUIWorkspace = createAction(prefix + 'UPDATE_UI_WORKSPACE');

export const visitedAction = createAction(prefix + 'VISITED_ACTION');
