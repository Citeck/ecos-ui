import 'moment/locale/ru';
import 'moment/locale/en-gb';
import { ConnectedRouter } from 'connected-react-router';
import datePickerLocaleEn from 'date-fns/locale/en-GB';
import datePickerLocaleRu from 'date-fns/locale/ru';
import { Base64 } from 'js-base64';
import moment from 'moment';
import React from 'react';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { initAppRequest } from './actions/app';
import { setIsAuthenticated } from './actions/user';
import { loadThemeRequest } from './actions/view';
import { configureAPI } from './api';
import App from './components/App';
import IdleTimer from './components/IdleTimer';
import { RESET_AUTH_STATE_EVENT, emitter } from './helpers/ecosFetch';
import { getCurrentLocale, isMobileAppWebView } from './helpers/util';
import { i18nInit } from './i18n';
import plugins from './plugins';
import * as serviceWorker from './serviceWorkerRegistration';
import authService from './services/auth';
import configureStore, { getHistory } from './store';

import { NotificationManager } from '@/services/notifications';

import './helpers/polyfills';

import './build-info';
import './services/esign';
import './services/EcosModules';

import './styles/index.scss';

/* set moment locale */
const currentLocale = getCurrentLocale();
moment.locale(currentLocale);

/* set DatePicker locale */
registerLocale('en', datePickerLocaleEn);
registerLocale('ru', datePickerLocaleRu);
setDefaultLocale(currentLocale);

const { api, setNotAuthCallback } = configureAPI();
export const store = configureStore({ api });
const history = getHistory();
const setAuthStatus = () => {
  store.dispatch(setIsAuthenticated(false));
};

setNotAuthCallback(setAuthStatus);

emitter.on(RESET_AUTH_STATE_EVENT, setAuthStatus);

// window.requirejs.config({
//   baseUrl: '/share/res', // leave it for now
//   urlArgs: 'b=' + preval`module.exports = new Date().getTime()`,
//   paths: {
//     ecosui: '/js/ecos/ecosui',
//     css: '/js/lib/require-css'
//   }
// });

if (!window.Citeck) {
  window.Citeck = {};
}

window.Citeck.Plugins = plugins;
window.Citeck.NotificationManager = NotificationManager;
window.Citeck.Base64 = Base64;

const runApp = () => {
  store.dispatch(
    initAppRequest({
      onSuccess: (isAuthenticated) => {
        store.dispatch(
          loadThemeRequest({
            isAuthenticated,
            onSuccess: () => {
              i18nInit({ debug: process.env.NODE_ENV === 'development' }).then(() => {
                createRoot(document.getElementById('root')).render(
                  <Provider store={store}>
                    <ConnectedRouter history={history}>
                      <App />
                    </ConnectedRouter>
                  </Provider>,
                );
              });
            },
          }),
        );
      },
    }),
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
  .setCallback((idle) => {
    if (!idle) {
      api.app.touch().catch(() => {});
    }
  })
  .run();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
