import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import header from '../../../../src/reducers/header';
import user from '../../../../src/reducers/user';
import view from '../../../../src/reducers/view';

export const reducers = {
  header,
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
