import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import app from './app';
import bpmn from './bpmn';
import header from './header';
import modal from './modal';
import notification from './notification';
import slideMenu from './slideMenu';
import user from './user';
import view from './view';
import journals from './journals';
import { rootReducer as cardDetails } from './cardDetails';
import pageTabs from './pageTabs';
import dashboardSettings from './dashboardSettings';
import dashboard from './dashboard';

const reducers = {
  app,
  bpmn,
  cardDetails,
  header,
  modal,
  notification,
  slideMenu,
  user,
  view,
  journals,
  pageTabs,
  dashboardSettings,
  dashboard
};

export default history =>
  combineReducers({
    router: connectRouter(history),
    ...reducers
  });

export const createReducer = (asyncReducers, history) => {
  return combineReducers({
    router: connectRouter(history),
    ...reducers,
    ...asyncReducers
  });
};
