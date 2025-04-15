import { handleActions } from 'redux-actions';

import {
  initWorkspaces,
  setBlockedCurrentWorkspace,
  setDefaultWorkspace,
  setWorkspaces,
  setWorkspacesError,
  setPublicWorkspaces,
  setMyWorkspaces,
  setLoadingJoin,
  setLoading,
  setIsBlockedCurrentWorkspace
} from '@/actions/workspaces';
import { WorkspaceType } from '@/api/workspaces/types';

interface WorkspaceState {
  isLoading: boolean;
  isLoadingJoin: boolean;
  isError: boolean;
  workspaces: WorkspaceType[];
  myWorkspaces: WorkspaceType[];
  publicWorkspaces: WorkspaceType[];
  blockedCurrentWorkspace: {
    isBlock: boolean;
    workspace: WorkspaceType | null;
  };
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
  blockedCurrentWorkspace: {
    isBlock: false,
    workspace: null
  }
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
    [setBlockedCurrentWorkspace.toString()]: (state, { payload }: ReturnType<typeof setBlockedCurrentWorkspace>) => {
      return {
        ...state,
        blockedCurrentWorkspace: {
          isBlock: !payload.isCurrentUserMember,
          workspace: payload
        }
      };
    },
    [setIsBlockedCurrentWorkspace.toString()]: (state, { payload }: ReturnType<typeof setIsBlockedCurrentWorkspace>) => {
      return {
        ...state,
        blockedCurrentWorkspace: {
          ...state.blockedCurrentWorkspace,
          isBlock: payload
        }
      };
    }
  },
  initialState
);
