import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import app from './app';
import bpmn from './bpmn';
import bpmnAdmin from './bpmnAdmin';
import bpmnEditor from './bpmnEditor';
import charts from './charts';
import header from './header';
import modal from './modal';
import notification from './notification';
import user from './user';
import view from './view';
import journals from './journals';
import documentLibrary from './documentLibrary';
import pageTabs from './pageTabs';
import processAdmin from './processAdmin';
import tasks from './tasks';
import comments from './comments';
import activities from './activities';
import dashboard from './dashboard';
import dashboardSettings from './dashboardSettings';
import dmn from './dmn';
import dmnEditor from './dmnEditor';
import menu from './menu';
import slideMenu from './slideMenu';
import menuSettings from './menuSettings';
import currentTasks from './currentTasks';
import docStatus from './docStatus';
import eventsHistory from './eventsHistory';
import versionsJournal from './versionsJournal';
import recordActions from './recordActions';
import docAssociations from './docAssociations';
import timesheetSubordinates from './timesheet/subordinates';
import timesheetMine from './timesheet/mine';
import timesheetVerification from './timesheet/verification';
import timesheetDelegated from './timesheet/delegated';
import timesheetCommon from './timesheet/common';
import webPage from './webPage';
import birthdays from './birthdays';
import report from './report';
import barcode from './barcode';
import properties from './properties';
import documents from './documents';
import userProfile from './userProfile';
import docConstructor from './docConstructor';
import iconSelect from './iconSelect';
import instanceAdmin from './instanceAdmin';
import adminSection from './adminSection';
import cmmnEditor from './cmmnEditor';
import kanban from './kanban';
import processStatistics from './processStatistics';
import orgstructure from './orgstructure';

const reducers = {
  app,
  bpmn,
  bpmnAdmin,
  bpmnEditor,
  charts,
  header,
  modal,
  notification,
  user,
  view,
  journals,
  documentLibrary,
  pageTabs,
  processAdmin,
  tasks,
  comments,
  activities,
  dashboard,
  dashboardSettings,
  dmn,
  dmnEditor,
  slideMenu,
  menu,
  menuSettings,
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
  report,
  barcode,
  properties,
  documents,
  userProfile,
  docConstructor,
  iconSelect,
  instanceAdmin,
  adminSection,
  cmmnEditor,
  kanban,
  processStatistics,
  orgstructure
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
