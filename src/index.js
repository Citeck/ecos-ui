import 'react-app-polyfill/ie9';
import 'regenerator-runtime/runtime.js';
import './helpers/polyfills';

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
import { getCurrentLocale, isMobileAppWebView } from './helpers/util';

import authService from './services/auth';
import configureStore, { getHistory } from './store';
import { initAppRequest } from './actions/app';
import { setIsAuthenticated } from './actions/user';
import { loadThemeRequest } from './actions/view';

import { configureAPI } from './api';
import App from './components/App';
import IdleTimer from './components/IdleTimer';

import './styles/index.scss';

import './build-info';
import './services/esign';
import preval from 'preval.macro';
import './services/EcosModules';

const logger = Logger.create('EcoS');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

/* set moment locale */
const currentLocale = getCurrentLocale();
moment.locale(currentLocale);

/* set DatePicker locale */
registerLocale('en', datePickerLocaleEn);
registerLocale('ru', datePickerLocaleRu);
setDefaultLocale(currentLocale);

const { api, setNotAuthCallback } = configureAPI();
const store = configureStore({ api, logger });
const history = getHistory();

setNotAuthCallback(() => {
  store.dispatch(setIsAuthenticated(false));
});

window.requirejs.config({
  baseUrl: '/share/res', // leave it for now
  urlArgs: 'b=' + preval`module.exports = new Date().getTime()`,
  paths: {
    ecosui: '/js/ecos/ecosui',
    css: '/js/lib/require-css'
  }
});

document.addEventListener('DOMContentLoaded', () => {
  import('./constants/alfresco/util').then(({ default: util }) => {
    window.Alfresco.util = window.Alfresco.util || {};
    window.Alfresco.util = {
      ...window.Alfresco.util,
      ...util
    };
  });
});

const runApp = () => {
  store.dispatch(
    initAppRequest({
      onSuccess: isAuthenticated => {
        store.dispatch(
          loadThemeRequest({
            isAuthenticated,
            onSuccess: () => {
              i18nInit({ debug: process.env.NODE_ENV === 'development' }).then(() => {
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
};

//if (process.env.NODE_ENV === 'development' && !isMobileAppWebView()) {
//authService.init().then(runApp);
//} else {
runApp();
//}

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
