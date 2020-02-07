import { handleActions } from 'redux-actions';

import { getActiveTabTitle, initTabsComplete, setActiveTabTitle, setShowTabsStatus, setTabs, setTabTitle } from '../actions/pageTabs';

const initialState = {
  isShow: false,
  tabs: [],
  inited: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initTabsComplete]: (state, { payload }) => ({
      ...state,
      inited: true
    }),
    [setShowTabsStatus]: (state, { payload }) => ({
      ...state,
      isShow: payload
    }),
    [setTabs]: (state, { payload }) => ({
      ...state,
      tabs: payload
    }),
    [setTabTitle]: state => ({
      ...state
    }),
    [getActiveTabTitle]: state => ({
      ...state
    }),
    [setActiveTabTitle]: state => ({
      ...state
    })
  },
  initialState
);
