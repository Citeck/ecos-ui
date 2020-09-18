import { handleActions } from 'redux-actions';
import { initAppFailure, initAppSuccess, setDashboardEditable, setFooter, setLeftMenuEditable, setRedirectToNewUi } from '../actions/app';

const initialState = {
  isInit: false,
  isInitFailure: false,
  enableCache: true,
  dashboardEditable: false,
  leftMenuEditable: false,
  footer: null,
  redirectToNewUi: false
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
    }
  },
  initialState
);
