import '../../../fonts/citeck/css/citeck.css';

import 'react-app-polyfill/ie11';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';

import SlideMenu from '../components/SlideMenu';

import { MenuApi } from '../../../api/menu';
import { ViewApi } from '../../../api/view';
import { fakeApi } from '../../../api/fakeApi';
import { UserApi } from '../../../api/user';

import { detectMobileDevice, loadThemeRequest } from '../../../actions/view';
import { initMenuConfig } from '../../../actions/menu';
import { getUserData } from '../../../actions/user';

import configureStore from './store';
import { i18nInit } from '../../../i18n';

const logger = Logger.create('Legacy SlideMenu');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const api = {};
const store = configureStore({
  api,
  fakeApi,
  logger
});

api.menu = new MenuApi();
api.view = new ViewApi();
api.user = new UserApi();

const render = (elementId, props, callback) => {
  store.dispatch(
    loadThemeRequest({
      isAuthenticated: true,
      onSuccess: () => {
        store.dispatch(
          getUserData({
            onSuccess: () => {
              store.dispatch(initMenuConfig());
              store.dispatch(detectMobileDevice());

              i18nInit({ debug: false }).then(() => {
                ReactDOM.render(
                  <Provider store={store}>
                    <SlideMenu {...props} />
                  </Provider>,
                  document.getElementById(elementId),
                  callback
                );
              });
            }
          })
        );
      }
    })
  );
};

export { render };
