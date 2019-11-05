import { combineReducers } from 'redux';

import header from '../../../reducers/header';
import menu from '../../../reducers/menu';
import user from '../../../reducers/user';
import view from '../../../reducers/view';

const reducers = {
  header,
  menu,
  user,
  view
};

export default () =>
  combineReducers({
    ...reducers
  });
