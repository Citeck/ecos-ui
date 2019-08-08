import { createAction } from 'redux-actions';

const prefix = 'versionsJournal/';

export const getVersions = createAction(prefix + 'GET_VERSIONS_LIST');
export const setVersions = createAction(prefix + 'SET_VERSIONS_LIST');

export const getVersionsComparison = createAction(prefix + 'GET_VERSIONS_COMPARISON');

export const setActiveVersion = createAction(prefix + 'SET_ACTIVE_VERSION');
export const addNewVersion = createAction(prefix + 'ADD_NEW_VERSION');
