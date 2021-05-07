import { handleActions } from 'redux-actions';
import get from 'lodash/get';

import {
  collapseAllItems,
  setExpandableItems,
  setIsReady,
  setScrollTop,
  setSelectedId,
  setSiteDashboardEnable,
  setSlideMenuItems,
  toggleExpanded,
  toggleIsOpen
} from '../actions/slideMenu';
import SidebarService from '../services/sidebar';

const initialState = {
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
    [setSlideMenuItems]: (state, action) => {
      return {
        ...state,
        items: action.payload
      };
    },
    [setExpandableItems]: (state, action) => {
      const selectedId = state.selectedId || get(action, 'payload.selectedId');
      const expandableItems = SidebarService.getExpandableItems(state.items, selectedId, state.isOpen);

      return {
        ...state,
        expandableItems
      };
    },
    [toggleExpanded]: (state, { payload: selectedItem }) => {
      const isObject = !!selectedItem && typeof selectedItem === 'object';
      const idItem = isObject ? selectedItem.id : selectedItem;
      const initNestedItems = isObject && SidebarService.getExpandableItems(selectedItem.items || [], state.selectedId, state.isOpen);

      return {
        ...state,
        expandableItems: state.expandableItems.map(item => {
          if (item.id === idItem) {
            return {
              ...item,
              isNestedListExpanded: !item.isNestedListExpanded
            };
          }

          const nested = initNestedItems && initNestedItems.find(nested => item.id === nested.id);

          if (nested) {
            return nested;
          }

          return item;
        })
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
