import { handleActions } from 'redux-actions';

import {
  initAppFailure,
  initAppSuccess,
  setAppEdition,
  setDashboardEditable,
  setWidgetEditable,
  setFooter,
  setHomeLink,
  setLeftMenuEditable,
  setRedirectToNewUi,
  setSeparateActionListForQuery,
  setAllowToCreateWorkspace
} from '../actions/app';
import { URL } from '../constants';

const initialState = {
  isInit: false,
  isInitFailure: false,
  enableCache: true,
  dashboardEditable: false,
  isAllowToCreateWorkspace: false,
  widgetEditable: false,
  leftMenuEditable: false,
  footer: null,
  redirectToNewUi: false,
  homeLink: URL.DASHBOARD
};

Object.freeze(initialState);

export default handleActions(
  {
    [initAppSuccess]: (state, action) => {
      return {
        ...state,
        isInit: true
      };
    },
    [initAppFailure]: (state, action) => {
      return {
        ...state,
        isInit: true,
        isInitFailure: true
      };
    },
    [setAllowToCreateWorkspace]: (state, action) => {
      return {
        ...state,
        isAllowToCreateWorkspace: action.payload
      };
    },
    [setDashboardEditable]: (state, action) => {
      return {
        ...state,
        dashboardEditable: action.payload
      };
    },
    [setWidgetEditable]: (state, action) => {
      return {
        ...state,
        widgetEditable: action.payload
      };
    },
    [setAppEdition]: (state, action) => {
      return {
        ...state,
        appEdition: action.payload
      };
    },
    [setLeftMenuEditable]: (state, action) => {
      return {
        ...state,
        leftMenuEditable: action.payload
      };
    },
    [setFooter]: (state, action) => {
      return {
        ...state,
        footer: action.payload
      };
    },
    [setRedirectToNewUi]: (state, action) => {
      return {
        ...state,
        redirectToNewUi: action.payload
      };
    },
    [setHomeLink]: (state, action) => {
      return {
        ...state,
        homeLink: action.payload
      };
    },
    [setSeparateActionListForQuery]: (state, action) => {
      return {
        ...state,
        isSeparateActionListForQuery: action.payload
      };
    }
  },
  initialState
);
