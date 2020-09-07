import get from 'lodash/get';

export const selectUserName = state => get(state, 'user.userName');
export const selectIsAuthenticated = state => get(state, 'user.isAuthenticated');
export const selectIsAdmin = state => get(state, 'user.isAdmin');
