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
  setIsForAll,
  setLastAddedLeftItems,
  setLeftMenuItems,
  setLoading,
  setMenuIcons,
  setOpenMenuSettings,
  setOriginalConfig,
  setUserMenuItems
} from '../actions/menuSettings';
import MenuConverter from '../dto/menu';

const initialState = {
  editedId: undefined,
  originalConfig: {},
  leftItems: [],
  availableSections: [],
  createItems: [],
  userMenuItems: [],
  authorities: [],
  groupPriority: [],
  isLoading: false,
  isLoadingPriority: false,
  isOpenMenuSettings: false,
  lastAddedLeftItems: [],
  lastAddedCreateItems: [],
  fontIcons: [],
  isForAll: false
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
    [setOriginalConfig]: (state, { payload }) => ({
      ...state,
      originalConfig: payload
    }),
    [setLeftMenuItems]: (state, { payload }) => {
      const leftItems = treeSetDndIndex(payload);

      return {
        ...state,
        leftItems,
        availableSections: MenuConverter.getAllSectionsFlat(leftItems),
        isLoading: false
      };
    },
    [setCreateMenuItems]: (state, { payload }) => ({
      ...state,
      createItems: treeSetDndIndex(payload),
      isLoading: false
    }),
    [setLastAddedLeftItems]: (state, { payload }) => ({
      ...state,
      lastAddedLeftItems: payload
    }),
    [setUserMenuItems]: (state, { payload }) => ({
      ...state,
      userMenuItems: treeSetDndIndex(payload),
      isLoading: false
    }),
    [addJournalMenuItems]: state => ({
      ...state,
      isLoading: true
    }),
    [setAuthorities]: (state, { payload }) => ({
      ...state,
      authorities: payload
    }),
    [setIsForAll]: (state, { payload }) => ({
      ...state,
      isForAll: payload
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
