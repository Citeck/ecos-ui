import { handleActions } from 'redux-actions';
import {
  collapseAllItems,
  setIsReady,
  setLargeLogo,
  setScrollTop,
  setSelectedId,
  setSiteDashboardEnable,
  setSlideMenuExpandableItems,
  setSlideMenuItems,
  setSmallLogo,
  toggleExpanded,
  toggleIsOpen
} from '../actions/slideMenu';

const initialState = {
  smallLogo: null,
  largeLogo: null,
  selectedId: null,
  items: [],
  expandableItems: [],
  isOpen: false,
  scrollTop: 0,
  isReady: false,
  isSiteDashboardEnable: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [setSelectedId]: (state, action) => {
      return {
        ...state,
        selectedId: action.payload
      };
    },
    [setSmallLogo]: (state, action) => {
      return {
        ...state,
        smallLogo: action.payload
      };
    },
    [setLargeLogo]: (state, action) => {
      return {
        ...state,
        largeLogo: action.payload
      };
    },
    [setSlideMenuItems]: (state, action) => {
      return {
        ...state,
        items: action.payload
      };
    },
    [setSlideMenuExpandableItems]: (state, action) => {
      return {
        ...state,
        expandableItems: action.payload
      };
    },
    [toggleExpanded]: (state, action) => {
      return {
        ...state,
        expandableItems: (() => {
          const expandableItem = state.expandableItems.find(fi => fi.id === action.payload) || {};
          const listWithoutItem = state.expandableItems.filter(fi => fi.id !== action.payload);
          return [
            ...listWithoutItem,
            {
              ...expandableItem,
              isNestedListExpanded: !expandableItem.isNestedListExpanded
            }
          ];
        })()
      };
    },
    [collapseAllItems]: (state, action) => {
      return {
        ...state,
        expandableItems: state.expandableItems.map(item => ({ ...item, isNestedListExpanded: false }))
      };
    },
    [toggleIsOpen]: (state, action) => {
      return {
        ...state,
        isOpen: action.payload
      };
    },
    [setScrollTop]: (state, action) => {
      return {
        ...state,
        scrollTop: action.payload
      };
    },
    [setIsReady]: (state, action) => {
      return {
        ...state,
        isReady: action.payload
      };
    },
    [setSiteDashboardEnable]: (state, action) => {
      return {
        ...state,
        isSiteDashboardEnable: action.payload
      };
    }
  },
  initialState
);
