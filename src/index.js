import 'react-app-polyfill/ie9';
import 'regenerator-runtime/runtime.js';
import './helpers/polyfills';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import debounce from 'lodash/debounce';
import * as serviceWorker from './serviceWorker';

import { i18nInit } from './i18n';

import moment from 'moment';
import 'moment/locale/ru';
import 'moment/locale/en-gb';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import datePickerLocaleEn from 'date-fns/locale/en-GB';
import datePickerLocaleRu from 'date-fns/locale/ru';
import { getCurrentLocale, isMobileAppWebView } from './helpers/util';

import logger from './services/logger';
import authService from './services/auth';
import configureStore, { getHistory } from './store';
import { initAppRequest } from './actions/app';
import { setIsAuthenticated } from './actions/user';
import { loadThemeRequest } from './actions/view';
import { NotificationManager } from 'react-notifications';

import { configureAPI } from './api';
import App from './components/App';
import IdleTimer from './components/IdleTimer';

import './styles/index.scss';

import './build-info';
import './services/esign';
import preval from 'preval.macro';
import './services/EcosModules';
import { Base64 } from 'js-base64';
import { RESET_AUTH_STATE_EVENT, emitter } from './helpers/ecosFetch';

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

document.addEventListener('DOMContentLoaded', () => {
  import('./constants/alfresco/util').then(({ default: util }) => {
    window.Alfresco.util = window.Alfresco.util || {};
    window.Alfresco.util = {
      ...window.Alfresco.util,
      ...util
    };
  });
});

if (!window.Citeck) {
  window.Citeck = {};
}
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
} else {
  runApp();
}

const cancelTouchTimer = new IdleTimer();
let cancelTouch = false;
const rerunCancelTouchTimer = debounce(
  () => {
    cancelTouchTimer.stop().run();
  },
  500,
  { leading: true, trailing: true, maxWait: 60000 }
);

cancelTouchTimer
  .setCheckInterval(60000)
  .setIdleTimeout(60000 * 3)
  .setResetIdleCallback(() => {
    cancelTouch = false;
    rerunCancelTouchTimer();
  })
  .setIdleCallback(() => {
    cancelTouch = true;
  })
  .run();

const getCancelTouchStatus = () => cancelTouch;
const idleTimer = new IdleTimer();
idleTimer
  .setCheckInterval(60000)
  .setIdleTimeout(60000 * 60 * 3)
  .setNoIdleCallback(() => {
    api.app.touch(getCancelTouchStatus()).catch(() => {});
  })
  .run();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
