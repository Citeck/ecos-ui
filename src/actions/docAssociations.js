import { createAction } from 'redux-actions';

const prefix = 'docAssociations/';

export const initStore = createAction(prefix + 'INIT_STORE_RECORD');
export const resetStore = createAction(prefix + 'RESET_STORE_RECORD');

export const getSectionList = createAction(prefix + 'GET_SECTION_LIST');
export const setSectionList = createAction(prefix + 'SET_SECTION_LIST');

export const getAssociations = createAction(prefix + 'GET_ASSOCIATIONS');
export const setAssociations = createAction(prefix + 'SET_ASSOCIATIONS');
export const addAssociations = createAction(prefix + 'ADD_ASSOCIATIONS');
export const removeAssociations = createAction(prefix + 'REMOVE_ASSOCIATIONS');
export const viewAssociation = createAction(prefix + 'VIEW_ASSOCIATION');

export const setAllowedConnections = createAction(prefix + 'SET_ALLOWED_CONNECTIONS');

export const getMenu = createAction(prefix + 'GET_MENU');
export const setMenu = createAction(prefix + 'SET_MENU');

export const setError = createAction(prefix + 'SET_ERROR');
