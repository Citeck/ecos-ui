import '../../../fonts/citeck/css/citeck.css';

import 'react-app-polyfill/ie11';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';

import Header from '../Header';

import { AppApi } from '../../../api/app';
import { CustomIconApi } from '../../../api/customIcon';
import { MenuApi } from '../../../api/menu';
import { UserApi } from '../../../api/user';
import { ViewApi } from '../../../api/view';
import { fakeApi } from '../../../api/fakeApi';

import { initAppRequest } from '../../../actions/app';
import { initMenuConfig } from '../../../actions/menu';
import { fetchUserMenuData } from '../../../actions/header';
import { loadThemeRequest } from '../../../actions/view';

import configureStore from './store';
import { i18nInit } from '../../../i18n';

const logger = Logger.create('Header');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const api = {};
const store = configureStore({
  api,
  fakeApi,
  logger
});

api.app = new AppApi(store);
api.customIcon = new CustomIconApi(store);
api.menu = new MenuApi(store);
api.user = new UserApi(store);
api.view = new ViewApi(store);

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
