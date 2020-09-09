import { combineReducers } from 'redux';

import app from '../../../reducers/app';
import menu from '../../../reducers/menu';
import slideMenu from '../../../reducers/slideMenu';
import view from '../../../reducers/view';
import user from '../../../reducers/user';

const reducers = {
  app,
  menu,
  slideMenu,
  view,
  user
};

export default () =>
  combineReducers({
    ...reducers
  });
