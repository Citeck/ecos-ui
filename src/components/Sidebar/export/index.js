import '../../../styles/bootstrap.scss';
import '../../../fonts/citeck/css/citeck.css';

import 'react-app-polyfill/ie11';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';

import Sidebar from '../Sidebar';

import { configureAPI } from '../../../api';
import { fakeApi } from '../../../api/fakeApi';

import { detectMobileDevice, loadThemeRequest } from '../../../actions/view';
import { initMenuConfig } from '../../../actions/menu';
import { getUserData } from '../../../actions/user';

import configureStore from './store';
import { i18nInit } from '../../../i18n';

const logger = Logger.create('Sidebar');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const { api } = configureAPI();
const store = configureStore({
  api,
  fakeApi,
  logger
});

const render = (elementId, props, callback) => {
  store.dispatch(
    loadThemeRequest({
      onSuccess: () => {
        store.dispatch(
          getUserData({
            onSuccess: () => {
              store.dispatch(initMenuConfig());
              store.dispatch(detectMobileDevice());

              i18nInit({ debug: false }).then(() => {
                ReactDOM.render(
                  <Provider store={store}>
                    <Sidebar {...props} />
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
