import { handleActions } from 'redux-actions';
import {
  getAvailableSoloItems,
  getMenuConfig,
  initMenuSettings,
  saveMenuConfig,
  setAvailableSoloItems,
  setMenuConfig,
  setOpenMenuSettings,
  setRequestResultMenuConfig
} from '../actions/menu';

const initialState = {
  type: '',
  items: [],
  links: [],
  availableSoloItems: [],
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
    [getAvailableSoloItems]: startLoading,
    [getMenuConfig]: startLoading,
    [saveMenuConfig]: startLoading,

    [setMenuConfig]: (state, action) => {
      const { type, links, items } = action.payload;

      return {
        ...state,
        type,
        links,
        items,
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
    [setAvailableSoloItems]: (state, { payload }) => ({
      ...state,
      availableSoloItems: payload,
      isLoading: false
    }),
    [setOpenMenuSettings]: (state, { payload }) => ({
      ...state,
      isOpenMenuSettings: payload
    })
  },
  initialState
);
