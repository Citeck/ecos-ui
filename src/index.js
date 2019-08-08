import 'react-app-polyfill/ie9';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import * as serviceWorker from './serviceWorker';

import moment from 'moment';
import 'moment/locale/ru';
import 'moment/locale/en-gb';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import datePickerLocaleEn from 'date-fns/locale/en-GB';
import datePickerLocaleRu from 'date-fns/locale/ru';
import { getCurrentLocale } from './helpers/util';

import configureStore, { getHistory } from './store';
import { requireShareAssets } from './share';
import { initAppRequest, loadThemeRequest } from './actions/app';
import {
  AppApi,
  BpmnApi,
  CommentsApi,
  DashboardApi,
  JournalsApi,
  MenuApi,
  OrgStructApi,
  TasksApi,
  UserApi,
  VersionsJournalApi
} from './api';
import { fakeApi } from './api/fakeApi';
import App from './components/App';
import IdleTimer from './components/IdleTimer';
import './index.scss';

import './build-info';

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
api.versionsJournal = new VersionsJournalApi(store);

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

store.dispatch(initAppRequest());
store.dispatch(
  loadThemeRequest({
    onSuccess: themeName => {
      requireShareAssets(themeName).then(() => {
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

const idleTimer = new IdleTimer();
idleTimer
  .setCheckInterval(60000)
  .setIdleTimeout(60000 * 60 * 3)
  .setNoIdleCallback(() => {
    fetch('/share/proxy/alfresco/citeck/ecos/touch', { credentials: 'include' });
  })
  .run();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
