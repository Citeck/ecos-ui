import { all } from 'redux-saga/effects';
import app from './app';
import bpmn from './bpmn';
import header from './header';
import slideMenu from './slideMenu';
import user from './user';
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
import view from './view';
import webPage from './webPage';

export default function* rootSaga(extraArguments) {
  yield all([
    app(extraArguments),
    bpmn(extraArguments),
    header(extraArguments),
    slideMenu(extraArguments),
    user(extraArguments),
    journals(extraArguments),
    pageTabs(extraArguments),
    tasks(extraArguments),
    comments(extraArguments),
    dashboardSettings(extraArguments),
    dashboard(extraArguments),
    menu(extraArguments),
    currentTasks(extraArguments),
    docStatus(extraArguments),
    eventsHistory(extraArguments),
    versionsJournal(extraArguments),
    recordActions(extraArguments),
    docAssociations(extraArguments),
    view(extraArguments),
    webPage(extraArguments)
  ]);
}
