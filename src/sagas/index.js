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
import barcode from './barcode';

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
    barcode(extraArguments)
  ]);
}
