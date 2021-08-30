import { handleActions } from 'redux-actions';
import {
  addAssociations,
  getAssociations,
  getMenu,
  initStore,
  removeAssociations,
  resetStore,
  setAllowedConnections,
  setAssociations,
  setError,
  setMenu
} from '../actions/docAssociations';
import { deleteStateById, getCurrentStateById } from '../helpers/redux';

export const initialState = {
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
    [resetStore]: (state, { payload }) => deleteStateById(state, payload),

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
        ...getCurrentStateById(state, payload, initialState),
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
