import { handleActions } from 'redux-actions';
import { setShowTabsStatus } from '../actions/pageTabs';

const initialState = {
  isShow: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [setShowTabsStatus]: (state, actions) => ({
      ...state,
      isShow: actions.payload
    })
  },
  initialState
);
