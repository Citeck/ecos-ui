import { handleActions } from 'redux-actions';
import {
  getAssociations,
  initStore,
  setAllowedConnections,
  setAssociations,
  getMenu,
  setMenu,
  setSectionList,
  addAssociations,
  setError,
  removeAssociations
} from '../actions/docAssociations';

export const initialState = {
  // list of sections
  sectionList: [],
  // list of associations sorted by relationship
  associations: [],
  // list of available associations (first level menu)
  allowedAssociations: [],
  // drop-down menu (consists of 3 levels)
  menu: [],
  isLoading: false,
  isLoadingMenu: false,
  associationsTotalCount: 0
};

Object.freeze(initialState);

export default handleActions(
  {
    [initStore]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload]) {
        ownState = { ...ownState, ...state[payload] };
      }

      return {
        ...state,
        [payload]: { ...ownState }
      };
    },

    [setSectionList]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        sectionList: payload.sectionList
      }
    }),

    [setAssociations]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        associations: payload.associations,
        associationsTotalCount: payload.associationsTotalCount,
        isLoading: false
      }
    }),
    [getAssociations]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoading: true
      }
    }),
    [addAssociations]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        isLoading: true
      }
    }),
    [removeAssociations]: (state, { payload }) => ({
      ...state,
      [payload.record]: {
        ...state[payload.record],
        isLoading: true
      }
    }),

    [setAllowedConnections]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        allowedAssociations: payload.allowedAssociations
      }
    }),

    [getMenu]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        isLoadingMenu: true
      }
    }),
    [setMenu]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        menu: payload.menu,
        isLoadingMenu: false
      }
    }),

    [setError]: (state, { payload }) => ({
      ...state,
      [payload.key]: {
        ...state[payload.key],
        isLoading: false
      }
    })
  },
  {}
);
