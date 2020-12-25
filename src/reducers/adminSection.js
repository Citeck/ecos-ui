import { handleActions } from 'redux-actions';
import { setActiveSection, setGroupSectionList } from '../actions/adminSection';

const initialState = {
  groupSectionList: [],
  activeSection: {}
};

Object.freeze(initialState);

export default handleActions(
  {
    [setGroupSectionList]: (state, action) => {
      return {
        ...state,
        groupSectionList: action.payload || []
      };
    },
    [setActiveSection]: (state, action) => {
      return {
        ...state,
        activeSection: action.payload || {}
      };
    }
  },
  initialState
);
