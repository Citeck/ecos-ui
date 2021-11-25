import { createAction } from 'redux-actions';

const prefix = 'adminSection/';

export const initAdminSection = createAction(prefix + 'INIT_ADMIN_SECTION');
export const setAdminSectionInitStatus = createAction(prefix + 'SET_ADMIN_SECTION_INIT_STATUS');
export const fetchGroupSectionList = createAction(prefix + 'GET_GROUP_SECTION_LIST');
export const setGroupSectionList = createAction(prefix + 'SET_GROUP_SECTION_LIST');
export const setActiveSection = createAction(prefix + 'SET_ACTIVE_SECTION');
export const updActiveSection = createAction(prefix + 'UPD_ACTIVE_SECTION');
export const getIsAccessible = createAction(prefix + 'GET_IS_ACCESSIBLE');
export const setIsAccessible = createAction(prefix + 'SET_IS_ACCESSIBLE');
export const toggleMenu = createAction(prefix + 'TOGGLE_MENU');
export const toggleSection = createAction(prefix + 'TOGGLE_SECTION');
