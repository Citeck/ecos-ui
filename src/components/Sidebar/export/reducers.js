import { combineReducers } from 'redux';

import app from '../../../reducers/app';
import menu from '../../../reducers/menu';
import slideMenu from '../../../reducers/slideMenu';
import view from '../../../reducers/view';

const reducers = {
  app,
  menu,
  slideMenu,
  view
};

export default () =>
  combineReducers({
    ...reducers
  });
