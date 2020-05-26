import { handleActions } from 'redux-actions';
import {
  getSettingsConfig,
  initSettings,
  saveSettingsConfig,
  setCustomIcons,
  setOpenMenuSettings,
  setSettingsConfig
} from '../actions/menuSettings';

const initialState = {
  id: null,
  type: null,
  items: [],
  authorities: [],
  isLoading: false
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
      isOpenMenuSettings: payload
    }),
    [setCustomIcons]: (state, { payload }) => ({
      ...state,
      customIcons: payload
    })
  },
  initialState
);
