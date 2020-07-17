import { all } from 'redux-saga/effects';
import app from './app';
import bpmn from './bpmn';
import header from './header';
import journals from './journals';
import pageTabs from './pageTabs';
import tasks from './tasks';
import comments from './comments';
import dashboardSettings from './dashboardSettings';
import dashboard from './dashboard';
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

export default function* rootSaga(extraArguments) {
  yield all([
    app(extraArguments),
    bpmn(extraArguments),
    header(extraArguments),
    journals(extraArguments),
    pageTabs(extraArguments),
    tasks(extraArguments),
    comments(extraArguments),
    dashboardSettings(extraArguments),
    dashboard(extraArguments),
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
    documents(extraArguments),
    userProfile(extraArguments),
    docConstructor(extraArguments),
    iconSelect(extraArguments)
  ]);
}
