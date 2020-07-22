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
  setMenuItems,
  setOpenMenuSettings,
  setSettingsConfig
} from '../actions/menuSettings';
import { treeSetDndIndex } from '../helpers/arrayOfObjects';

const initialState = {
  id: null,
  items: [],
  authorities: [],
  groupPriority: [],
  isLoading: false,
  isLoadingPriority: false,
  isOpenMenuSettings: false,
  lastAddedItems: []
};

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [initSettings]: startLoading,
    [removeSettings]: startLoading,
    [getSettingsConfig]: startLoading,
    [saveSettingsConfig]: startLoading,

    [setSettingsConfig]: (state, action) => {
      const { items, ...data } = action.payload;

      return {
        ...state,
        ...data,
        items: treeSetDndIndex(items || []),
        isLoading: false
      };
    },

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
