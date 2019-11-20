import { combineReducers } from 'redux';

import slideMenu from '../reducers/slideMenu';
import view from '../../../reducers/view';

const reducers = {
  slideMenu,
  view
};

export default () =>
  combineReducers({
    ...reducers
  });
