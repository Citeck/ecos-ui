import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import journals from '../../../../src/reducers/journals';

export const reducers = {
  journals
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
