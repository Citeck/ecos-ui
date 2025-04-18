import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';

import activities from './activities';
import adminSection from './adminSection';
import app from './app';
import barcode from './barcode';
import birthdays from './birthdays';
import bpmn from './bpmn';
import bpmnAdmin from './bpmnAdmin';
import bpmnEditor from './bpmnEditor';
import charts from './charts';
import cmmnEditor from './cmmnEditor';
import comments from './comments';
import currentTasks from './currentTasks';
import customWidgetHtml from './customWidgetHtml';
import dashboard from './dashboard';
import dashboardSettings from './dashboardSettings';
import dmn from './dmn';
import dmnEditor from './dmnEditor';
import docAssociations from './docAssociations';
import timesheetVerification from './timesheet/verification';
import timesheetDelegated from './timesheet/delegated';
import timesheetCommon from './timesheet/common';
import webPage from './webPage';
import report from './report';
import properties from './properties';
import documents from './documents';
import userProfile from './userProfile';
import docConstructor from './docConstructor';
import docStatus from './docStatus';
import documentLibrary from './documentLibrary';
import eventsHistory from './eventsHistory';
import header from './header';
import iconSelect from './iconSelect';
import instanceAdmin from './instanceAdmin';
import journals from './journals';
import kanban from './kanban';
import menu from './menu';
import menuSettings from './menuSettings';
import modal from './modal';
import notification from './notification';
import orgstructure from './orgstructure';
import pageTabs from './pageTabs';
import previewList from './previewList';
import processAdmin from './processAdmin';
import processStatistics from './processStatistics';
import recordActions from './recordActions';
import slideMenu from './slideMenu';
import tasks from './tasks';
import timesheetMine from './timesheet/mine';
import timesheetSubordinates from './timesheet/subordinates';
import user from './user';
import versionsJournal from './versionsJournal';
import view from './view';
import workspaces from './workspaces';

const reducers = {
  app,
  bpmn,
  bpmnAdmin,
  bpmnEditor,
  charts,
  header,
  workspaces,
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
  customWidgetHtml,
  previewList,
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
