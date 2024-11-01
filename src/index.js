import 'react-app-polyfill/ie9';
import 'regenerator-runtime/runtime.js';
import './helpers/polyfills';
import React from 'react';
import ReactDOM from 'react-dom';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import * as serviceWorker from './serviceWorkerRegistration';
import preval from 'preval.macro';
import { NotificationManager } from 'react-notifications';
import moment from 'moment';
import 'moment/locale/ru';
import 'moment/locale/en-gb';
import { Base64 } from 'js-base64';
import datePickerLocaleEn from 'date-fns/locale/en-GB';
import datePickerLocaleRu from 'date-fns/locale/ru';

import { getCurrentLocale, isMobileAppWebView } from './helpers/util';
import logger from './services/logger';
import authService from './services/auth';
import configureStore, { getHistory } from './store';
import { initAppRequest } from './actions/app';
import { setIsAuthenticated } from './actions/user';
import { loadThemeRequest } from './actions/view';
import { configureAPI } from './api';
import App from './components/App';
import IdleTimer from './components/IdleTimer';
import plugins from './plugins';
import './build-info';
import './services/esign';
import './services/EcosModules';
import { RESET_AUTH_STATE_EVENT, emitter } from './helpers/ecosFetch';
import { i18nInit } from './i18n';

import './styles/index.scss';

/* set moment locale */
const currentLocale = getCurrentLocale();
moment.locale(currentLocale);

/* set DatePicker locale */
registerLocale('en', datePickerLocaleEn);
registerLocale('ru', datePickerLocaleRu);
setDefaultLocale(currentLocale);

const { api, setNotAuthCallback } = configureAPI();
export const store = configureStore({ api, logger });
const history = getHistory();
const setAuthStatus = () => {
  store.dispatch(setIsAuthenticated(false));
};

setNotAuthCallback(setAuthStatus);

emitter.on(RESET_AUTH_STATE_EVENT, setAuthStatus);

window.requirejs.config({
  baseUrl: '/share/res', // leave it for now
  urlArgs: 'b=' + preval`module.exports = new Date().getTime()`,
  paths: {
    ecosui: '/js/ecos/ecosui',
    css: '/js/lib/require-css'
  }
});

if (!window.Citeck) {
  window.Citeck = {};
}

window.Citeck.Plugins = plugins;
window.Citeck.NotificationManager = NotificationManager;
window.Citeck.Base64 = Base64;

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

if (process.env.NODE_ENV === 'development' && !isMobileAppWebView()) {
  authService.init().then(runApp);
  api.app.setCustomLogoutAction(() => authService.logout());
} else {
  runApp();
}

const idleTimer = new IdleTimer();
idleTimer
  .setCallbackRepeatTime(30 * 1000) // 30s
  .setIdleTimeout(60 * 60 * 1000) // 1h
  .setCallback(idle => {
    if (!idle) {
      api.app.touch().catch(() => {});
    }
  })
  .run();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
