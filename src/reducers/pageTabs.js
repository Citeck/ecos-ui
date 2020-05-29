import { handleActions } from 'redux-actions';

import { initTabsComplete, setShowTabsStatus, setTabs } from '../actions/pageTabs';

const initialState = {
  isShow: false,
  tabs: [],
  inited: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initTabsComplete]: state => ({
      ...state,
      inited: true
    }),
    [setShowTabsStatus]: (state, { payload }) => ({
      ...state,
      isShow: payload
    }),
    [setTabs]: (state, { payload }) => ({
      ...state,
      tabs: payload || []
    })
  },
  initialState
);
