import { handleActions } from 'redux-actions';
import {
  getAvailableSoloItems,
  getMenuConfig,
  initMenuConfig,
  saveMenuConfig,
  setAvailableSoloItems,
  setMenuConfig,
  setRequestResultMenuConfig
} from '../actions/menu';

const initialState = {
  type: '',
  items: [],
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
    [initMenuConfig]: startLoading,
    [getAvailableSoloItems]: startLoading,
    [getMenuConfig]: startLoading,
    [saveMenuConfig]: startLoading,

    [setMenuConfig]: (state, action) => {
      const { id, type } = action.payload;

      return {
        ...state,
        id,
        type,
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
    })
  },
  initialState
);
