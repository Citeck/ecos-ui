import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';

import createRootReducer from './reducers';
import sagas from './sagas';

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

export default function configureStore(ea) {
  const initialState = {};
  const store = createStore(
    createRootReducer(),
    initialState,
    composeEnhancers(applyMiddleware(sagaMiddleware, thunk.withExtraArgument(ea), ...optionalMiddlewares))
  );

  sagaMiddleware.run(sagas, ea);

  return store;
}
