import { combineReducers } from 'redux';

import header from './header';
import modal from './modal';
import user from './user';

const reducers = {
  header,
  modal,
  user
};

export default combineReducers(reducers);

export const createReducer = asyncReducers => {
  return combineReducers({
    ...reducers,
    ...asyncReducers
  });
};
