import { handleActions } from 'redux-actions';

import { treeSetDndIndex } from '../helpers/arrayOfObjects';
import {
  addJournalMenuItems,
  getGroupPriority,
  getSettingsConfig,
  resetStore,
  saveMenuSettings,
  setAuthorities,
  setCreateMenuItems,
  setGroupPriority,
  setLastAddedLeftItems,
  setLeftMenuItems,
  setLoading,
  setMenuIcons,
  setOpenMenuSettings
} from '../actions/menuSettings';

const initialState = {
  editedId: undefined,
  leftItems: [],
  createItems: [],
  authorities: [],
  groupPriority: [],
  isLoading: false,
  isLoadingPriority: false,
  isOpenMenuSettings: false,
  lastAddedLeftItems: [],
  lastAddedCreateItems: [],
  fontIcons: []
};

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [saveMenuSettings]: startLoading,

    [getSettingsConfig]: (state, { payload }) => ({
      ...state,
      isLoading: true,
      editedId: payload.id,
      disabledEdit: payload.disabledEdit
    }),
    [setOpenMenuSettings]: (state, { payload }) => ({
      ...state,
      ...initialState,
      isOpenMenuSettings: payload
    }),
    [setLeftMenuItems]: (state, { payload }) => ({
      ...state,
      leftItems: treeSetDndIndex(payload),
      isLoading: false
    }),
    [setCreateMenuItems]: (state, { payload }) => ({
      ...state,
      createItems: treeSetDndIndex(payload),
      isLoading: false
    }),
    [setLastAddedLeftItems]: (state, { payload }) => ({
      ...state,
      lastAddedLeftItems: payload
    }),
    [addJournalMenuItems]: state => ({
      ...state,
      isLoading: true
    }),
    [setAuthorities]: (state, { payload }) => ({
      ...state,
      authorities: payload
    }),
    [setMenuIcons]: (state, { payload }) => ({
      ...state,
      fontIcons: payload.font,
      customIcons: payload.custom
    }),
    [getGroupPriority]: state => ({
      ...state,
      groupPriority: [],
      isLoadingPriority: true
    }),
    [setGroupPriority]: (state, { payload }) => ({
      ...state,
      groupPriority: treeSetDndIndex(payload),
      isLoadingPriority: false
    }),
    [setLoading]: state => ({
      ...state,
      isLoading: false
    }),
    [resetStore]: _ => initialState
  },
  initialState
);
