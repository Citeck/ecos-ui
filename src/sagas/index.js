import { all } from 'redux-saga/effects';

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
import customEvent from './customEvent';
import customWidgetHtml from './customWidgetHtml';
import dashboard from './dashboard';
import dashboardSettings from './dashboardSettings';
import dmn from './dmn';
import dmnEditor from './dmnEditor';
import docAssociations from './docAssociations';
import docConstructor from './docConstructor';
import docLib from './docLib';
import docStatus from './docStatus';
import documents from './documents';
import eventsHistory from './eventsHistory';
import header from './header';
import iconSelect from './iconSelect';
import instanceAdmin from './instanceAdmin';
import journals from './journals';
import kanban from './kanban';
import menu from './menu';
import menuSettings from './menuSettings';
import orgstructure from './orgstructure';
import pageTabs from './pageTabs';
import processAdmin from './processAdmin';
import processStatistics from './processStatistics';
import properties from './properties';
import recordActions from './recordActions';
import report from './report';
import slideMenu from './slideMenu';
import tasks from './tasks';
import timesheetCommon from './timesheet/common';
import timesheetDelegated from './timesheet/delegated';
import timesheetMine from './timesheet/mine';
import timesheetSubordinates from './timesheet/subordinates';
import timesheetVerification from './timesheet/verification';
import userProfile from './userProfile';
import versionsJournal from './versionsJournal';
import view from './view';
import webPage from './webPage';
import workspaces from './workspaces';

export default function* rootSaga(extraArguments) {
  yield all([
    app(extraArguments),
    bpmn(extraArguments),
    bpmnAdmin(extraArguments),
    bpmnEditor(extraArguments),
    docLib(extraArguments),
    header(extraArguments),
    workspaces(extraArguments),
    journals(extraArguments),
    pageTabs(extraArguments),
    tasks(extraArguments),
    comments(extraArguments),
    activities(extraArguments),
    dashboard(extraArguments),
    dashboardSettings(extraArguments),
    dmn(extraArguments),
    dmnEditor(extraArguments),
    charts(extraArguments),
    menu(extraArguments),
    slideMenu(extraArguments),
    menuSettings(extraArguments),
    currentTasks(extraArguments),
    docStatus(extraArguments),
    eventsHistory(extraArguments),
    versionsJournal(extraArguments),
    recordActions(extraArguments),
    docAssociations(extraArguments),
    timesheetSubordinates(extraArguments),
    timesheetMine(extraArguments),
    timesheetVerification(extraArguments),
    timesheetDelegated(extraArguments),
    timesheetCommon(extraArguments),
    view(extraArguments),
    webPage(extraArguments),
    birthdays(extraArguments),
    report(extraArguments),
    barcode(extraArguments),
    properties(extraArguments),
    processAdmin(extraArguments),
    documents(extraArguments),
    userProfile(extraArguments),
    docConstructor(extraArguments),
    iconSelect(extraArguments),
    instanceAdmin(extraArguments),
    adminSection(extraArguments),
    cmmnEditor(extraArguments),
    customEvent(extraArguments),
    kanban(extraArguments),
    processStatistics(extraArguments),
    customWidgetHtml(extraArguments),
    orgstructure(extraArguments)
  ]);
}
