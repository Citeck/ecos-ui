import { createAction } from 'redux-actions';

const prefix = 'hierarchy/';

export const checkHierarchyEnabled = createAction(prefix + 'CHECK_HIERARCHY_ENABLED');
export const setIsHierarchyEnabled = createAction(prefix + 'SET_IS_HIERARCHY_ENABLED');
