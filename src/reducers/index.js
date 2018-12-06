import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import app from './app';
import header from './header';
import modal from './modal';
import notification from './notification';
import slideMenu from './slideMenu';
import user from './user';
import view from './view';
import { rootReducer as cardDetails } from './cardDetails';

const reducers = {
  app,
  cardDetails,
  header,
  modal,
  notification,
  slideMenu,
  user,
  view
};

export default history =>
  combineReducers({
    router: connectRouter(history),
    ...reducers
  });

export const createReducer = (asyncReducers, history) => {
  return combineReducers({
    router: connectRouter(history),
    ...reducers,
    ...asyncReducers
  });
};
