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
import tasks from './tasks';
import comments from './comments';
import dashboardSettings from './dashboardSettings';
import dashboard from './dashboard';
import menu from './menu';
import currentTasks from './currentTasks';
import docStatus from './docStatus';
import barcode from './barcode';

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
  tasks,
  comments,
  dashboardSettings,
  dashboard,
  menu,
  currentTasks,
  docStatus,
  barcode
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
