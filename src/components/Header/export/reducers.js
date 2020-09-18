import { combineReducers } from 'redux';

import app from '../../../reducers/app';
import iconSelect from '../../../reducers/iconSelect';
import header from '../../../reducers/header';
import menu from '../../../reducers/menu';
import menuSettings from '../../../reducers/menuSettings';
import user from '../../../reducers/user';
import view from '../../../reducers/view';

const reducers = {
  app,
  iconSelect,
  header,
  menu,
  menuSettings,
  user,
  view
};

export default () =>
  combineReducers({
    ...reducers
  });
