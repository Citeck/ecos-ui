import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import reducers, { createReducer } from './reducers';
import sagas from './sagas';
// import { connectRouter, routerMiddleware } from 'connected-react-router';

const sagaMiddleware = createSagaMiddleware();

let optionalMiddlewares = [];
if (process.env.NODE_ENV === 'development') {
  const logger = createLogger({ collapsed: true, diff: true });
  optionalMiddlewares.push(logger);
}

let composeEnhancers = compose;
if (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
  composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
}

export default function configureStore(ea, history) {
  const initialState = {};
  const store = createStore(
    // connectRouter(history)(reducers),
    reducers,
    initialState,
    composeEnhancers(
      applyMiddleware(
        sagaMiddleware,
        // routerMiddleware(history),
        thunk.withExtraArgument(ea),
        ...optionalMiddlewares
      )
    )
  );

  sagaMiddleware.run(sagas, ea);
  store.asyncReducers = {}; // Async reducer registry

  return store;
}

export function injectAsyncReducer(store, name, reducer) {
  store.asyncReducers[name] = reducer;
  store.replaceReducer(createReducer(store.asyncReducers));
}
