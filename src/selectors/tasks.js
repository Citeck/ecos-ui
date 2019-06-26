import { createSelector } from 'reselect';

export const selectUserName = state => state.user.userName;
export const selectUserUid = state => state.user.uid;
export const selectDashletTaskList = (state, dId) => state.tasks[dId];

export const selectUserData = createSelector(
  [selectUserName, selectUserUid],
  (userName, uid) => ({ userName, uid })
);
