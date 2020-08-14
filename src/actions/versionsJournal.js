import { createAction } from 'redux-actions';

const prefix = 'versionsJournal/';

export const getVersions = createAction(prefix + 'GET_VERSIONS_LIST');
export const setVersions = createAction(prefix + 'SET_VERSIONS_LIST');

export const getVersionsComparison = createAction(prefix + 'GET_VERSIONS_COMPARISON');
export const setVersionsComparison = createAction(prefix + 'SET_VERSIONS_COMPARISON');

export const setActiveVersion = createAction(prefix + 'SET_ACTIVE_VERSION');
export const setActiveVersionSuccess = createAction(prefix + 'SET_ACTIVE_VERSION_SUCCESS');
export const setActiveVersionError = createAction(prefix + 'SET_ACTIVE_VERSION_ERROR');

export const toggleModal = createAction(prefix + 'TOGGLE_MODAL');

export const addNewVersion = createAction(prefix + 'ADD_NEW_VERSION');
export const addNewVersionSuccess = createAction(prefix + 'ADD_NEW_VERSION_SUCCESS');
export const addNewVersionError = createAction(prefix + 'ADD_NEW_VERSION_ERROR');

export const getWritePermission = createAction(prefix + 'GET_WRITE_PERMISSION');
export const setWritePermission = createAction(prefix + 'SET_WRITE_PERMISSION');
