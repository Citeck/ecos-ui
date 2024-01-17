import { createSelector } from 'reselect';

import get from 'lodash/get';

export const selectState = state => state.instanceAdmin;
export const selectInstanceId = (_, props) => props.instanceId;
export const selectTabId = (_, props) => props.tabId;

export const selectInstanceActions = createSelector(selectState, selectInstanceId, (state, instanceId) => {
  return get(state, `${instanceId}.actionsInfo`, {});
});

export const selectInstanceMetaInfo = createSelector(selectState, selectInstanceId, (state, instanceId) => {
  return get(state, `${instanceId}.metaInfo`, {});
});

export const selectInstanceTabInfo = createSelector(selectState, selectInstanceId, selectTabId, (state, instanceId, tabId) => {
  return get(state, `${instanceId}.${tabId}`, {});
});
