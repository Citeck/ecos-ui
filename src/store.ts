import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory, History } from 'history';
import { applyMiddleware, compose, createStore, Middleware, Reducer, Store } from 'redux';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';

import createRootReducer, { createReducer } from './reducers';
import sagas from './sagas';

import { allowedModes } from '@/constants';
import { SETTING_ENABLE_SAGA_LOGGER } from '@/pages/DevTools/constants';
import { ExtraArgumentsStore, RootState } from '@/types/store';

interface ExtendedStore extends Store<RootState> {
  asyncReducers: Record<string, Reducer>;
}

const sagaMiddleware = createSagaMiddleware();
const history: History = createBrowserHistory();

let store: ExtendedStore;

const optionalMiddlewares: Middleware[] = [];
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

export default function configureStore(ea: ExtraArgumentsStore, defaultState = {}): ExtendedStore {
  const initialState = { ...defaultState };

  const baseStore = createStore(
    createRootReducer(history),
    initialState,
    composeEnhancers(applyMiddleware(routerMiddleware(history), sagaMiddleware, thunk.withExtraArgument(ea), ...optionalMiddlewares))
  );

  sagaMiddleware.run(sagas, ea);
  store = {
    ...baseStore,
    asyncReducers: {} // Async reducer registry
  };

  return store;
}

export function getHistory(): History {
  return history;
}

export function getStore() {
  return store || {};
}

export function injectAsyncReducer(store: ExtendedStore, name: string, reducer: Reducer) {
  store.asyncReducers[name] = reducer;

  // @ts-ignore
  store.replaceReducer(createReducer(store.asyncReducers, history));
}
