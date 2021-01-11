import { createAction } from 'redux-actions';

const prefix = 'adminSection/';

export const initAdminSection = createAction(prefix + 'INIT_ADMIN_SECTION');
export const fetchGroupSectionList = createAction(prefix + 'GET_GROUP_SECTION_LIST');
export const setGroupSectionList = createAction(prefix + 'SET_GROUP_SECTION_LIST');
export const setActiveSection = createAction(prefix + 'SET_ACTIVE_SECTION');
