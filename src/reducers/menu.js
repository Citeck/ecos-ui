import { handleActions } from 'redux-actions';
import {
  getAvailableMenuItems,
  getMenuConfig,
  initMenuSettings,
  saveMenuConfig,
  setAvailableMenuItems,
  setResultSaveMenuConfig,
  setMenuConfig
} from '../actions/menu';

const initialState = {
  type: '',
  links: [],
  availableMenuItems: [],
  isLoading: false,
  saveResult: {
    status: ''
  }
};

Object.freeze(initialState);

const startLoading = state => ({ ...state, isLoading: true });

export default handleActions(
  {
    [initMenuSettings]: startLoading,
    [getAvailableMenuItems]: startLoading,
    [getMenuConfig]: startLoading,
    [saveMenuConfig]: startLoading,

    [setMenuConfig]: (state, action) => {
      const { type, links } = action.payload;

      return {
        ...state,
        type,
        links,
        isLoading: false
      };
    },
    [setResultSaveMenuConfig]: (state, { payload }) => {
      const { status } = payload;

      return {
        ...state,
        saveResult: {
          status
        },
        isLoading: false
      };
    },
    [setAvailableMenuItems]: (state, { payload }) => ({
      ...state,
      availableMenuItems: payload,
      isLoading: false
    })
  },
  initialState
);
