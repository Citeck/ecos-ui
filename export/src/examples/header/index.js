import 'react-app-polyfill/ie9';

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';

import ShareHeader from '../../../../src/components/Header';
import { reducers } from './reducers';
import sagas from './sagas';
import { fakeApi } from '../../../../src/api/fakeApi';

import { initAppRequest } from '../../../../src/actions/app';
import { setCreateCaseWidgetIsCascade } from '../../../../src/actions/header';

import { AppApi } from '../../../../src/api/app';
import { MenuApi } from '../../../../src/api/menu';
import { UserApi } from '../../../../src/api/user';

import Logger from 'logplease';

const logger = Logger.create('EcoS');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const api = {};
const rootReducer = combineReducers(reducers);

let composeEnhancers = compose;
if (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
  composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
}

const sagaMiddleware = createSagaMiddleware();
const store = createStore(rootReducer, {}, composeEnhancers(
  applyMiddleware(sagaMiddleware, thunk.withExtraArgument({ api, fakeApi, logger })),
  )
);

sagaMiddleware.run(sagas, { api, fakeApi, logger });

api.app = new AppApi();
api.menu = new MenuApi();
api.user = new UserApi();

export const render = (elementId, props) => {
  store.dispatch(initAppRequest());
  store.dispatch(setCreateCaseWidgetIsCascade(true));

  ReactDOM.render(
    <Provider store={store}>
      <ShareHeader { ...props } />
    </Provider>,
    document.getElementById(elementId)
  );
};







