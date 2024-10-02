import { handleActions } from 'redux-actions';

import { setIsMobile, setTheme, setThemeConfig, setViewNewJournal } from '../actions/view';

const initialState = {
  isMobile: false,
  isViewNewJournal: false,
  theme: null,
  themeConfig: {
    id: '',
    name: '',
    images: {},
    cacheKey: ''
  }
};

Object.freeze(initialState);

export default handleActions(
  {
    [setIsMobile]: (state, action) => {
      return {
        ...state,
        isMobile: action.payload
      };
    },
    [setTheme]: (state, action) => {
      return {
        ...state,
        theme: action.payload
      };
    },
    [setThemeConfig]: (state, action) => {
      return {
        ...state,
        themeConfig: action.payload
      };
    },
    [setViewNewJournal]: (state, action) => {
      return {
        ...state,
        isViewNewJournal: action.payload
      };
    }
  },
  initialState
);
