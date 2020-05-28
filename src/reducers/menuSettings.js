import { handleActions } from 'redux-actions';
import {
  addJournalMenuItems,
  getSettingsConfig,
  initSettings,
  saveSettingsConfig,
  setCustomIcons,
  setMenuItems,
  setOpenMenuSettings,
  setSettingsConfig
} from '../actions/menuSettings';

const initialState = {
  id: null,
  type: null,
  items: [],
  authorities: [],
  isLoading: false,
  isOpenMenuSettings: false
};

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [initSettings]: startLoading,
    [getSettingsConfig]: startLoading,
    [saveSettingsConfig]: startLoading,

    [setSettingsConfig]: (state, action) => {
      return {
        ...state,
        ...action.payload,
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
      items: payload,
      isLoading: false
    }),
    [addJournalMenuItems]: (state, { payload }) => ({
      ...state,
      isLoading: true
    }),
    [setCustomIcons]: (state, { payload }) => ({
      ...state,
      customIcons: payload
    })
  },
  initialState
);
