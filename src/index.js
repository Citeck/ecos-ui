import 'react-app-polyfill/ie9';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import * as serviceWorker from './serviceWorker';

import { i18nInit } from './i18n';

import moment from 'moment';
import 'moment/locale/ru';
import 'moment/locale/en-gb';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import datePickerLocaleEn from 'date-fns/locale/en-GB';
import datePickerLocaleRu from 'date-fns/locale/ru';
import { getCurrentLocale } from './helpers/util';

import configureStore, { getHistory } from './store';
import { initAppRequest } from './actions/app';
import { loadThemeRequest } from './actions/view';
import {
  AppApi,
  BarcodeApi,
  BirthdaysApi,
  BpmnApi,
  CommentsApi,
  DashboardApi,
  DocAssociationsApi,
  DocStatusApi,
  EventsHistoryApi,
  JournalsApi,
  MenuApi,
  MyTimesheetApi,
  OrgStructApi,
  PageTabsApi,
  PropertiesApi,
  RecordActionsApi,
  TasksApi,
  TimesheetCommonApi,
  TimesheetDelegatedApi,
  TimesheetSubordinatesApi,
  TimesheetVerificationApi,
  UserApi,
  VersionsJournalApi,
  ViewApi,
  DocumentsApi
} from './api';
import { fakeApi } from './api/fakeApi';
import App from './components/App';
import IdleTimer from './components/IdleTimer';
import { polyfills } from './helpers/polyfills';

import './styles/index.scss';

import './build-info';
import './services/esign';

polyfills();

const logger = Logger.create('EcoS');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

/* set moment locale */
const currentLocale = getCurrentLocale();
moment.locale(currentLocale);

/* set DatePicker locale */
registerLocale('en', datePickerLocaleEn);
registerLocale('ru', datePickerLocaleRu);
setDefaultLocale(currentLocale);

const api = {};
const store = configureStore({
  api,
  fakeApi,
  logger
});

api.app = new AppApi(store);
api.bpmn = new BpmnApi(store);
api.menu = new MenuApi(store);
api.orgStruct = new OrgStructApi(store);
api.user = new UserApi(store);
api.journals = new JournalsApi(store);
api.tasks = new TasksApi(store);
api.comments = new CommentsApi(store);
api.dashboard = new DashboardApi(store);
api.pageTabs = new PageTabsApi(store);
api.docStatus = new DocStatusApi(store);
api.eventsHistory = new EventsHistoryApi(store);
api.versionsJournal = new VersionsJournalApi(store);
api.recordActions = new RecordActionsApi(store);
api.docAssociations = new DocAssociationsApi(store);
api.view = new ViewApi(store);
api.birthdays = new BirthdaysApi(store);
api.barcode = new BarcodeApi(store);
api.timesheetCommon = new TimesheetCommonApi(store);
api.timesheetSubordinates = new TimesheetSubordinatesApi(store);
api.timesheetMine = new MyTimesheetApi(store);
api.timesheetVerification = new TimesheetVerificationApi(store);
api.timesheetDelegated = new TimesheetDelegatedApi(store);
api.properties = new PropertiesApi(store);
api.documents = new DocumentsApi(store);

/**
 * todo: Maybe need such union all api?
 */
// Object
//   .keys(API)
//   .forEach((key => {
//   let name = key.replace('Api', '');
//
//   name = name[0].toLowerCase() + name.slice(1);
//   api[name] = new API[key](store);
// }));

const history = getHistory();

// TODO simplify
store.dispatch(
  loadThemeRequest({
    onSuccess: () => {
      store.dispatch(
        initAppRequest({
          onSuccess: isAuthenticated => {
            i18nInit({
              debug: process.env.NODE_ENV === 'development',
              shouldLoadLegacyMessages: isAuthenticated
            }).then(() => {
              ReactDOM.render(
                <Provider store={store}>
                  <ConnectedRouter history={history}>
                    <App />
                  </ConnectedRouter>
                </Provider>,
                document.getElementById('root')
              );
            });
          }
        })
      );
    }
  })
);

const idleTimer = new IdleTimer();
idleTimer
  .setCheckInterval(60000)
  .setIdleTimeout(60000 * 60 * 3)
  .setNoIdleCallback(() => {
    api.app.touch().catch(() => {});
  })
  .run();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
