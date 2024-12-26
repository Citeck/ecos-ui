import { handleActions } from 'redux-actions';
import { handleAction } from '../helpers/redux';
import {
  setActiveSection,
  setAdminSectionInitStatus,
  setGroupSectionList,
  setIsAccessible,
  toggleMenu,
  toggleSection
} from '../actions/adminSection';

const initialState = {
  wsSections: {},
  groupSectionList: [],
  activeSection: {},
  isAccessible: undefined,
  isOpenMenu: true,
  isInitiated: false,
  sectionState: {}
};

Object.freeze(initialState);

export default handleActions(
  {
    [setGroupSectionList]: (state, action) => ({ ...state, groupSectionList: action.payload || [] }),
    [setAdminSectionInitStatus]: (state, action) => ({ ...state, isInitiated: action.payload || false }),
    [setActiveSection]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      if (!stateId) {
        return { ...state, activeSection: action.payload || {} };
      }

      return {
        ...state,
        wsSections: {
          ...state.wsSections,
          [stateId]: {
            ...state.wsSections[stateId],
            activeSection: action.payload || {}
          }
        },
        activeSection: action.payload || {}
      };
    },
    [setIsAccessible]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      if (!stateId) {
        return { ...state, isAccessible: !!action.payload };
      }

      return {
        ...state,
        wsSections: {
          ...state.wsSections,
          [stateId]: {
            ...state.wsSections[stateId],
            isAccessible: !!action.payload
          }
        },
        isAccessible: !!action.payload
      };
    },
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
