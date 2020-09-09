import get from 'lodash/get';

export const selectUserName = state => get(state, 'user.userName');
export const selectIsAuthenticated = state => get(state, 'user.isAuthenticated');
export const selectIsAdmin = state => get(state, 'user.isAdmin');
export const selectUserUid = state => get(state, 'user.uid');
export const selectUserFullName = state => get(state, 'user.fullName');
export const selectIsNewUIAvailable = state => get(state, 'user.isNewUIAvailable');
