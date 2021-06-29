import { handleActions } from 'redux-actions';
import { setActiveSection, setGroupSectionList, setIsAccessible } from '../actions/adminSection';

const initialState = {
  groupSectionList: [],
  activeSection: {},
  isAccessible: undefined
};

Object.freeze(initialState);

export default handleActions(
  {
    [setGroupSectionList]: (state, action) => ({ ...state, groupSectionList: action.payload || [] }),
    [setActiveSection]: (state, action) => ({ ...state, activeSection: action.payload || {} }),
    [setIsAccessible]: (state, action) => ({ ...state, isAccessible: !!action.payload })
  },
  initialState
);
