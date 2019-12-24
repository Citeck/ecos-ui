import { createAction } from 'redux-actions';

const prefix = 'docAssociations/';

export const initStore = createAction(prefix + 'INIT_STORE');

export const getSectionList = createAction(prefix + 'GET_SECTION_LIST');
export const setSectionList = createAction(prefix + 'SET_SECTION_LIST');

export const getDocuments = createAction(prefix + 'GET_DOCUMENTS');
export const setDocuments = createAction(prefix + 'SET_DOCUMENTS');
export const addDocuments = createAction(prefix + 'ADD_DOCUMENTS');
export const removeDocuments = createAction(prefix + 'REMOVE_DOCUMENTS');

export const setAllowedConnections = createAction(prefix + 'SET_ALLOWED_CONNECTIONS');

export const getMenu = createAction(prefix + 'GET_MENU');
export const setMenu = createAction(prefix + 'SET_MENU');
