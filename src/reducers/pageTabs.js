import { handleActions } from 'redux-actions';
import { setShowTabsStatus, setTabs } from '../actions/pageTabs';

const initialState = {
  isShow: false,
  tabs: []
};

Object.freeze(initialState);

export default handleActions(
  {
    [setShowTabsStatus]: (state, actions) => ({
      ...state,
      isShow: actions.payload
    }),
    [setTabs]: (state, actions) => ({
      ...state,
      tabs: actions.payload
    })
  },
  initialState
);
