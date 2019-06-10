import { handleActions } from 'redux-actions';
import { setUserMenuConfig } from '../actions/menu';
import { MENU_TYPE } from '../constants';

const initialState = {
  type: MENU_TYPE.LEFT,
  links: []
};

Object.freeze(initialState);

export default handleActions(
  {
    [setUserMenuConfig]: (state, action) => {
      return {
        ...state,
        ...action.payload
      };
    }
  },
  initialState
);
