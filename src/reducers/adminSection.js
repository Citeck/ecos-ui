import { handleActions } from 'redux-actions';
import { setActiveSection, setGroupSectionList, setIsAccessible, toggleMenu, toggleSection } from '../actions/adminSection';

const initialState = {
  groupSectionList: [],
  activeSection: {},
  isAccessible: undefined,
  isOpenMenu: false,
  sectionState: {}
};

Object.freeze(initialState);

export default handleActions(
  {
    [setGroupSectionList]: (state, action) => ({ ...state, groupSectionList: action.payload || [] }),
    [setActiveSection]: (state, action) => ({ ...state, activeSection: action.payload || {} }),
    [setIsAccessible]: (state, action) => ({ ...state, isAccessible: !!action.payload }),
    [toggleMenu]: (state, action) => ({ ...state, isOpenMenu: action.payload }),
    [toggleSection]: (state, { payload }) => ({
      ...state,
      sectionState: {
        ...state.sectionState,
        [payload.id]: payload.isOpen
      }
    })
  },
  initialState
);
