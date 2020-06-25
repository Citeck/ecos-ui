import { handleActions } from 'redux-actions';

import {
  addJournalMenuItems,
  getGroupPriority,
  getSettingsConfig,
  initSettings,
  saveSettingsConfig,
  setGroupPriority,
  setLastAddedItems,
  setMenuItems,
  setOpenMenuSettings,
  setSettingsConfig
} from '../actions/menuSettings';
import { treeSetDndIndex } from '../helpers/arrayOfObjects';

const initialState = {
  id: null,
  type: null,
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
    [getSettingsConfig]: startLoading,
    [saveSettingsConfig]: startLoading,

    [setSettingsConfig]: (state, { payload }) => {
      return {
        ...state,
        ...payload,
        items: treeSetDndIndex(payload.items || []),
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
    [getGroupPriority]: state => ({
      ...state,
      groupPriority: [],
      isLoadingPriority: true
    }),
    [setGroupPriority]: (state, { payload }) => ({
      ...state,
      groupPriority: treeSetDndIndex(payload),
      isLoadingPriority: false
    })
  },
  initialState
);
