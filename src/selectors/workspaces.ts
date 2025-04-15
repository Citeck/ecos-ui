import { get } from 'lodash';

import { RootState } from '@/types/store';

export const selectWorkspaces = (state: RootState) => get(state, 'workspaces.workspaces', []);
export const selectMyWorkspaces = (state: RootState) => get(state, 'workspaces.myWorkspaces', []);
export const selectPublicWorkspaces = (state: RootState) => get(state, 'workspaces.publicWorkspaces', []);

export const selectWorkspaceById = (state: RootState, id: string) => {
  return get(state, 'workspaces.workspaces', []).find(({ id: wsId }) => wsId === id);
};
export const selectWorkspaceIsLoading = (state: RootState) => get(state, 'workspaces.isLoading', true);
export const selectWorkspaceIsLoadingJoin = (state: RootState) => get(state, 'workspaces.isLoadingJoin', false);
export const selectCurrentWorkspaceBlocked = (state: RootState) => get(state, 'workspaces.blockedCurrentWorkspace.workspace', false);
export const selectCurrentWorkspaceIsBlocked = (state: RootState) => get(state, 'workspaces.blockedCurrentWorkspace.isBlock', false);
export const selectWorkspaceIsError = (state: RootState) => get(state, 'workspaces.isError', false);
export const selectWorkspaceHomeLinkById = (state: RootState, id: string) => {
  const select = get(state, 'workspaces.workspaces', []).find(({ id: wsId }) => wsId === id);

  if (!select) {
    return null;
  }

  return get(select, 'homePageLink', '');
};
