import { get } from 'lodash';

export const selectWorkspaces = state => get(state, 'workspaces.workspaces', []);
export const selectWorkspaceById = (state, id) => {
  return get(state, 'workspaces.workspaces', []).find(({ wsId }) => wsId === id);
};
export const selectWorkspaceIsLoading = state => get(state, 'workspaces.isLoading', true);
export const selectCurrentWorkspaceIsBlocked = state => get(state, 'workspaces.blockedCurrentWorkspace', false);
export const selectWorkspaceIsError = state => get(state, 'workspaces.isError', false);
export const selectWorkspaceHomeLinkById = (state, id) => {
  const select = get(state, 'workspaces.workspaces', []).find(({ wsId }) => wsId === id);

  if (!select) {
    return null;
  }

  return get(select, 'homePageLink', '');
};
