import { handleActions } from 'redux-actions';

import {
  addJournalMenuItems,
  getGroupPriority,
  getSettingsConfig,
  initSettings,
  removeSettings,
  saveSettingsConfig,
  setAuthorities,
  setGroupPriority,
  setLastAddedItems,
  setLoading,
  setMenuIcons,
  setMenuItems,
  setOpenMenuSettings
} from '../actions/menuSettings';
import { treeSetDndIndex } from '../helpers/arrayOfObjects';

const initialState = {
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
    [initSettings]: startLoading,
    [removeSettings]: startLoading,
    [getSettingsConfig]: startLoading,
    [saveSettingsConfig]: startLoading,

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
    })
  },
  initialState
);
