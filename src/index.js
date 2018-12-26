import 'react-app-polyfill/ie9';

import React from 'react';
import ReactDOM from 'react-dom';
import Logger from 'logplease';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import * as serviceWorker from './serviceWorker';

import configureStore, { getHistory } from './store';
import { requireShareAssets } from './share';
import { initAppRequest } from './actions/app';
import { AppApi, BpmnApi, MenuApi, UserApi } from './api';
import { fakeApi } from './api/fakeApi';
import App from './components/App';
import './index.scss';

const logger = Logger.create('EcoS');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const store = configureStore({
  api: {
    app: new AppApi(),
    bpmn: new BpmnApi(),
    menu: new MenuApi(),
    user: new UserApi()
  },
  fakeApi,
  logger
});

const history = getHistory();

store.dispatch(initAppRequest());

requireShareAssets().then(() => {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <App />
      </ConnectedRouter>
    </Provider>,
    document.getElementById('root')
  );
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
