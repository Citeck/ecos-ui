import 'react-app-polyfill/ie11';

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';

import { reducers } from './reducers';
import sagas from './sagas';

import { JournalsApi } from '../../../../api';
import JournalsDashlet from '../JournalsDashlet';

import Logger from 'logplease';

import { registerCiteckComponent } from '../../../../helpers/util';

const logger = Logger.create('JournalsDashlet');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const api = {};
const rootReducer = combineReducers(reducers);

const sagaMiddleware = createSagaMiddleware();
const store = createStore(rootReducer, {}, compose(applyMiddleware(sagaMiddleware, thunk.withExtraArgument({ api, logger }))));

sagaMiddleware.run(sagas, { api, logger });

api.journals = new JournalsApi(store);

let render = (elementId, props) => {
  ReactDOM.render(
    <Provider store={store}>
      <JournalsDashlet {...props} />
    </Provider>,
    document.getElementById(elementId)
  );
};

registerCiteckComponent('JournalsDashlet', {
  render: render
});

export default render;
