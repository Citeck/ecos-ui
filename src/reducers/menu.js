import { handleActions } from 'redux-actions';
import {
  getAvailableMenuItems,
  getMenuConfig,
  initMenuSettings,
  saveMenuConfig,
  setAvailableMenuItems,
  setMenuConfig,
  setRequestResultMenuConfig
} from '../actions/menu';

const initialState = {
  type: '',
  links: [],
  availableMenuItems: [],
  isLoading: false,
  requestResult: {
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
    [setRequestResultMenuConfig]: (state, { payload }) => {
      const { status } = payload;

      return {
        ...state,
        requestResult: {
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
