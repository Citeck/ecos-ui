import '../../../styles/bootstrap.scss';
import '../../../fonts/citeck/css/citeck.css';

import 'react-app-polyfill/ie11';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';

import Header from '../Header';

import { initAppRequest, initAppSettings } from '../../../actions/app';
import { fetchUserMenuData } from '../../../actions/header';
import { loadThemeRequest } from '../../../actions/view';

import { configureAPI } from '../../../api';
import { i18nInit } from '../../../i18n';
import configureStore from './store';

const logger = Logger.create('Header');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const { api } = configureAPI();
const store = configureStore({ api, logger });

const render = (elementId, props, callback) => {
  store.dispatch(
    initAppRequest({
      onSuccess: isAuthenticated => {
        store.dispatch(
          loadThemeRequest({
            isAuthenticated,
            onSuccess: () => {
              store.dispatch(initAppSettings());

              i18nInit({ debug: false }).then(() => {
                ReactDOM.render(
                  <Provider store={store}>
                    <Header {...props} />
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
