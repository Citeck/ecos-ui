import { combineReducers } from 'redux';

import app from './app';
import header from './header';
import modal from './modal';
import slideMenu from './slideMenu';
import user from './user';
import view from './view';

const reducers = {
  app,
  header,
  modal,
  slideMenu,
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
