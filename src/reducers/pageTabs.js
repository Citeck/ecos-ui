import { handleActions } from 'redux-actions';

import { getActiveTabTitle, setActiveTabTitle, setShowTabsStatus, setTabs, setTabTitle } from '../actions/pageTabs';

const initialState = {
  isShow: false,
  tabs: [],
  isLoadingTitle: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [setShowTabsStatus]: (state, { payload }) => ({
      ...state,
      isShow: payload
    }),
    [setTabs]: (state, { payload }) => ({
      ...state,
      tabs: payload
    }),
    [setTabTitle]: state => ({
      ...state,
      isLoadingTitle: false
    }),
    [getActiveTabTitle]: state => ({
      ...state,
      isLoadingTitle: true
    }),
    [setActiveTabTitle]: state => ({
      ...state,
      isLoadingTitle: false
    })
  },
  initialState
);
