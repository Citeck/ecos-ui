import '../../../styles/bootstrap.scss';
import '../../../fonts/citeck/css/citeck.css';

import 'react-app-polyfill/ie11';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';

import Header from '../Header';

import { configureAPI } from '../../../api';
import { fakeApi } from '../../../api/fakeApi';

import { initAppRequest } from '../../../actions/app';
import { initMenuConfig } from '../../../actions/menu';
import { fetchUserMenuData } from '../../../actions/header';
import { loadThemeRequest } from '../../../actions/view';

import configureStore from './store';
import { i18nInit } from '../../../i18n';

const logger = Logger.create('Header');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const { api } = configureAPI();
const store = configureStore({
  api,
  fakeApi,
  logger
});

const render = (elementId, props, callback) => {
  store.dispatch(
    initAppRequest({
      onSuccess: () => {
        store.dispatch(
          loadThemeRequest({
            onSuccess: () => {
              store.dispatch(initMenuConfig());
              store.dispatch(fetchUserMenuData());

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
