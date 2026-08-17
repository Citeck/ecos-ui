import { allowedModes } from '@citeck/constants';
import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory, History } from 'history';
import { applyMiddleware, compose, createStore, Middleware, Reducer, Store } from 'redux';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';

import createRootReducer, { createReducer } from './reducers';
import sagas from './sagas';

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
  store = Object.assign(baseStore, { asyncReducers: {} }) as ExtendedStore;

  return store;
}

export function getHistory(): History {
  return history;
}

export function getStore() {
  return store || {};
}

/**
 * The store, or null while the application has not bootstrapped one.
 *
 * `getStore` above answers with an empty object in that window, which is safe only for callers that
 * go on to read a field off it. A redux `<Provider store={{}}>` is not such a caller: it calls
 * `store.getState` while rendering and throws `TypeError: store.getState is not a function`, taking
 * down the whole React root it sits in. `TextArea.jsx` builds five roots that way — the ones that
 * carry the field's AI button and the rich-text editor — so a field rendered before bootstrap lost
 * its AI button silently, with nothing but a console error to show for it (D-UI-STORE-EMPTY).
 *
 * The empty-object fallback of `getStore` is left alone on purpose: it has callers of its own
 * (sagas, widget and menu services, record actions), and turning it into `undefined` there would
 * trade one crash for another. Whoever needs to KNOW whether a store exists asks here.
 */
export function getStoreIfReady(): ExtendedStore | null {
  return store || null;
}

export function injectAsyncReducer(store: ExtendedStore, name: string, reducer: Reducer) {
  store.asyncReducers[name] = reducer;

  // @ts-ignore
  store.replaceReducer(createReducer(store.asyncReducers, history));
}
