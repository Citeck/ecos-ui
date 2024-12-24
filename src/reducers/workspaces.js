import { handleActions } from 'redux-actions';

import { initWorkspaces, setBlockedCurrenWorkspace, setDefaultWorkspace, setWorkspaces, setWorkspacesError } from '../actions/workspaces';

const initialState = {
  isLoading: true,
  isError: false,
  workspaces: [],
  defaultWorkspace: null,
  blockedCurrentWorkspace: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initWorkspaces]: (state, action) => ({
      ...state,
      isLoading: action.payload
    }),
    [setWorkspaces]: (state, action) => ({
      ...state,
      workspaces: [...action.payload],
      isLoading: false
    }),
    [setWorkspacesError]: (state, action) => ({
      ...state,
      isError: true,
      isLoading: true
    }),
    [setDefaultWorkspace]: (state, action) => {
      return {
        ...state,
        defaultWorkspace: action.payload
      };
    },
    [setBlockedCurrenWorkspace]: (state, action) => {
      return {
        ...state,
        blockedCurrentWorkspace: action.payload
      };
    }
  },
  initialState
);
