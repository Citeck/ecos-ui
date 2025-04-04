import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { applyMiddleware, compose, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';

import createRootReducer, { createReducer } from './reducers';
import sagas from './sagas';

import { allowedModes } from '@/constants/index.js';
import { SETTING_ENABLE_SAGA_LOGGER } from '@/pages/DevTools/constants.js';

const sagaMiddleware = createSagaMiddleware();
const history = createBrowserHistory();

let store = {};

let optionalMiddlewares = [];
if (allowedModes.includes(process.env.NODE_ENV) || !!localStorage.getItem(SETTING_ENABLE_SAGA_LOGGER)) {
  const logger = createLogger({
    collapsed: true,
    diff: true
    //please, don't delete predicate, it's needed for dev
    //predicate: (getState, action) => action.type.startsWith('journal')
  });
  optionalMiddlewares.push(logger);
}

let composeEnhancers = compose;
if (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
  composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
}

export default function configureStore(ea, defaultState = {}) {
  const initialState = { ...defaultState };

  store = createStore(
    createRootReducer(history),
    initialState,
    composeEnhancers(applyMiddleware(routerMiddleware(history), sagaMiddleware, thunk.withExtraArgument(ea), ...optionalMiddlewares))
  );

  sagaMiddleware.run(sagas, ea);
  store.asyncReducers = {}; // Async reducer registry

  return store;
}

export function getHistory() {
  return history;
}

export function getStore() {
  return store || {};
}

export function injectAsyncReducer(store, name, reducer) {
  store.asyncReducers[name] = reducer;
  store.replaceReducer(createReducer(store.asyncReducers, history));
}
