import 'react-app-polyfill/ie11';

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';

import { reducers } from './reducers';
import sagas from './sagas';

import { JournalsApi } from '../../../../api/journalsApi';
import { RecordActionsApi } from '../../../../api/recordActions';
import JournalsDashlet from '../JournalsDashlet';

import Logger from 'logplease';

const logger = Logger.create('JournalsDashlet');
Logger.setLogLevel(Logger.LogLevels.DEBUG);

const api = {};
const rootReducer = combineReducers(reducers);

const sagaMiddleware = createSagaMiddleware();
const store = createStore(rootReducer, {}, compose(applyMiddleware(sagaMiddleware, thunk.withExtraArgument({ api, logger }))));

sagaMiddleware.run(sagas, { api, logger });

api.journals = new JournalsApi();
api.recordActions = new RecordActionsApi();

let render = (elementId, props) => {
  ReactDOM.render(
    <Provider store={store}>
      <JournalsDashlet {...props} />
    </Provider>,
    document.getElementById(elementId)
  );
};

export { render };
