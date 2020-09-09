import { combineReducers } from 'redux';

import slideMenu from '../../../reducers/slideMenu';
import view from '../../../reducers/view';
import user from '../../../reducers/user';

const reducers = {
  slideMenu,
  view,
  user
};

export default () =>
  combineReducers({
    ...reducers
  });
