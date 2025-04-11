import { handleActions } from 'redux-actions';

import {
  initWorkspaces,
  setBlockedCurrenWorkspace,
  setDefaultWorkspace,
  setWorkspaces,
  setWorkspacesError,
  setPublicWorkspaces,
  setMyWorkspaces,
  setLoadingJoin,
  setLoading
} from '@/actions/workspaces';
import { WorkspaceFullType } from '@/api/workspaces/types';

interface WorkspaceState {
  isLoading: boolean;
  isLoadingJoin: boolean;
  isError: boolean;
  workspaces: WorkspaceFullType[];
  myWorkspaces: WorkspaceFullType[];
  publicWorkspaces: WorkspaceFullType[];
  blockedCurrentWorkspace: boolean;
  defaultWorkspace: string | null;
}

const initialState: WorkspaceState = {
  isLoading: true,
  isError: false,
  isLoadingJoin: false,
  workspaces: [],
  myWorkspaces: [],
  publicWorkspaces: [],
  defaultWorkspace: null,
  blockedCurrentWorkspace: false
};

Object.freeze(initialState);

export default handleActions<WorkspaceState, any>(
  {
    [initWorkspaces.toString()]: (state, action: ReturnType<typeof initWorkspaces>) => ({
      ...state,
      isLoading: action.payload
    }),
    [setLoadingJoin.toString()]: (state, action: ReturnType<typeof setLoadingJoin>) => ({
      ...state,
      isLoadingJoin: action.payload
    }),
    [setLoading.toString()]: (state, action: ReturnType<typeof setLoading>) => ({
      ...state,
      isLoading: action.payload
    }),
    [setWorkspaces.toString()]: (state, action: ReturnType<typeof setWorkspaces>) => ({
      ...state,
      workspaces: [...action.payload],
      isLoading: false
    }),
    [setPublicWorkspaces.toString()]: (state, action: ReturnType<typeof setPublicWorkspaces>) => ({
      ...state,
      publicWorkspaces: [...action.payload],
      isLoading: false
    }),
    [setMyWorkspaces.toString()]: (state, action: ReturnType<typeof setMyWorkspaces>) => ({
      ...state,
      myWorkspaces: [...action.payload],
      isLoading: false
    }),
    [setWorkspacesError.toString()]: state => ({
      ...state,
      isError: true,
      isLoading: true
    }),
    [setDefaultWorkspace.toString()]: (state, action: ReturnType<typeof setDefaultWorkspace>) => {
      return {
        ...state,
        defaultWorkspace: action.payload
      };
    },
    [setBlockedCurrenWorkspace.toString()]: (state, action: ReturnType<typeof setBlockedCurrenWorkspace>) => {
      return {
        ...state,
        blockedCurrentWorkspace: action.payload
      };
    }
  },
  initialState
);
