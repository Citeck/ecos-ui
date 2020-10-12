import { handleActions } from 'redux-actions';

import { treeSetDndIndex } from '../helpers/arrayOfObjects';
import {
  addJournalMenuItems,
  getGroupPriority,
  getSettingsConfig,
  resetStore,
  saveMenuSettings,
  setAuthorities,
  setGroupPriority,
  setLastAddedItems,
  setLoading,
  setMenuIcons,
  setMenuItems,
  setOpenMenuSettings
} from '../actions/menuSettings';

const initialState = {
  editedId: undefined,
  items: [],
  authorities: [],
  groupPriority: [],
  isLoading: false,
  isLoadingPriority: false,
  isOpenMenuSettings: false,
  lastAddedItems: [],
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
    [setMenuItems]: (state, { payload }) => ({
      ...state,
      items: treeSetDndIndex(payload),
      isLoading: false
    }),
    [setLastAddedItems]: (state, { payload }) => ({
      ...state,
      lastAddedItems: payload
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
