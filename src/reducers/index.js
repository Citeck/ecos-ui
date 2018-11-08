import { combineReducers } from 'redux';

import user from './user';

const reducers = {
  user
};

export default combineReducers(reducers);

export const createReducer = asyncReducers => {
  return combineReducers({
    ...reducers,
    ...asyncReducers
  });
};
