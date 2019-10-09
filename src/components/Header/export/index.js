import 'react-app-polyfill/ie11';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';

import Header from '../Header';

import { AppApi } from '../../../api/app';
import { MenuApi } from '../../../api/menu';
import { UserApi } from '../../../api/user';
import { ViewApi } from '../../../api/view';
import { fakeApi } from '../../../api/fakeApi';

import { initAppRequest } from '../../../actions/app';
import { initMenuSettings } from '../../../actions/menu';
import { fetchUserMenuData } from '../../../actions/header';
import { loadThemeRequest } from '../../../actions/view';

import configureStore from './store';

const logger = Logger.create('Header');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const api = {};
const store = configureStore({
  api,
  fakeApi,
  logger
});

api.app = new AppApi(store);
api.menu = new MenuApi(store);
api.user = new UserApi(store);
api.view = new ViewApi(store);

const render = (elementId, props) => {
  store.dispatch(initAppRequest());
  store.dispatch(
    loadThemeRequest({
      onSuccess: () => {
        store.dispatch(initMenuSettings());
        store.dispatch(fetchUserMenuData());

        ReactDOM.render(
          <Provider store={store}>
            <Header {...props} />
          </Provider>,
          document.getElementById(elementId)
        );
      }
    })
  );
};

export { render };
