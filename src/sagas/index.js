import { all } from 'redux-saga/effects';
import app from './app';
import bpmn from './bpmn';
import bpmnAdmin from './bpmnAdmin';
import bpmnEditor from './bpmnEditor';
import docLib from './docLib';
import header from './header';
import journals from './journals';
import pageTabs from './pageTabs';
import tasks from './tasks';
import comments from './comments';
import dashboard from './dashboard';
import dashboardSettings from './dashboardSettings';
import dmn from './dmn';
import dmnEditor from './dmnEditor';
import processAdmin from './processAdmin';
import charts from './charts';
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
import view from './view';
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
import customEvent from './customEvent';
import kanban from './kanban';
import processStatistics from './processStatistics';
import orgstructure from './orgstructure';

export default function* rootSaga(extraArguments) {
  yield all([
    app(extraArguments),
    bpmn(extraArguments),
    bpmnAdmin(extraArguments),
    bpmnEditor(extraArguments),
    docLib(extraArguments),
    header(extraArguments),
    journals(extraArguments),
    pageTabs(extraArguments),
    tasks(extraArguments),
    comments(extraArguments),
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
    orgstructure(extraArguments)
  ]);
}
