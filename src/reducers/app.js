import { handleActions } from 'redux-actions';

import { URL } from '../constants';
import {
  initAppFailure,
  initAppSuccess,
  setAppEdition,
  setDashboardEditable,
  setFooter,
  setHomeLink,
  setJournalSeparatedDropdownActionsForAll,
  setLeftMenuEditable,
  setRedirectToNewUi
} from '../actions/app';

const initialState = {
  isInit: false,
  isInitFailure: false,
  enableCache: true,
  dashboardEditable: false,
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
    [setDashboardEditable]: (state, action) => {
      return {
        ...state,
        dashboardEditable: action.payload
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
    [setJournalSeparatedDropdownActionsForAll]: (state, action) => {
      return {
        ...state,
        journalSeparatedDropdownActionsForAll: action.payload
      };
    }
  },
  initialState
);
