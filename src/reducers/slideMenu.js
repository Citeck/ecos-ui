import { handleActions } from 'redux-actions';
import {
  setSelectedId,
  setSmallLogo,
  setLargeLogo,
  setSlideMenuItems,
  setSlideMenuExpandableItems,
  toggleExpanded,
  toggleIsOpen,
  setScrollTop,
  setIsReady
} from '../actions/slideMenu';

const initialState = {
  smallLogo: null,
  largeLogo: null,
  selectedId: null,
  items: [],
  expandableItems: [],
  isOpen: false,
  scrollTop: 0,
  isReady: false
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
          const expandableItem = state.expandableItems.find(fi => fi.id === action.payload);
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
    }
  },
  initialState
);
