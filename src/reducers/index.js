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
import pageTabs from './pageTabs';
import tasks from './tasks';
import comments from './comments';
import dashboardSettings from './dashboardSettings';
import dashboard from './dashboard';
import menu from './menu';
import currentTasks from './currentTasks';
import docStatus from './docStatus';
import eventsHistory from './eventsHistory';
import versionsJournal from './versionsJournal';
import recordActions from './recordActions';
import docAssociations from './docAssociations';
import esign from './esign';
import timesheetSubordinates from './timesheet/subordinates';
import timesheetMine from './timesheet/mine';
import timesheetVerification from './timesheet/verification';
import timesheetDelegated from './timesheet/delegated';
import timesheetCommon from './timesheet/common';
import webPage from './webPage';
import birthdays from './birthdays';
import barcode from './barcode';

const reducers = {
  app,
  bpmn,
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
  eventsHistory,
  versionsJournal,
  recordActions,
  docAssociations,
  timesheetSubordinates,
  timesheetMine,
  timesheetVerification,
  timesheetDelegated,
  timesheetCommon,
  webPage,
  birthdays,
  barcode,
  esign
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
