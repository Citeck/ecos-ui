import { combineReducers } from 'redux';

import app from './app';
import header from './header';
import modal from './modal';
import user from './user';
import view from './view';

const reducers = {
  app,
  header,
  modal,
  user,
  view
};

export default combineReducers(reducers);

export const createReducer = asyncReducers => {
  return combineReducers({
    ...reducers,
    ...asyncReducers
  });
};
