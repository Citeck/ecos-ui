import { handleActions } from 'redux-actions';
import { getActiveTabTitle, setActiveTabTitle, setShowTabsStatus, setTabs } from '../actions/pageTabs';

const initialState = {
  isShow: false,
  tabs: [],
  isLoadingTitle: false
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
    }),
    [getActiveTabTitle]: (state, actions) => ({
      ...state,
      isLoadingTitle: true
    }),
    [setActiveTabTitle]: (state, actions) => ({
      ...state,
      isLoadingTitle: false
    })
  },
  initialState
);
