import { createAction } from 'redux-actions';

const prefix = 'docAssociations/';

export const initStore = createAction(prefix + 'INIT_STORE');

export const getSectionList = createAction(prefix + 'GET_SECTION_LIST');
export const setSectionList = createAction(prefix + 'SET_SECTION_LIST');

export const getDocuments = createAction(prefix + 'GET_DOCUMENTS');
export const setAssociatedWithDocs = createAction(prefix + 'SET_ASSOCIATED_WITH_DOCS');
export const setBaseDocs = createAction(prefix + 'SET_BASE_DOCS');
export const setAccountingDocs = createAction(prefix + 'SET_ACCOUNTING_DOCS');
