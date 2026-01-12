import get from 'lodash/get';
import { createSelector } from 'reselect';

export const selectState = state => state.processAdmin;
export const selectProcessId = (_, props) => props.processId;
export const selectTabId = (_, props) => props.tabId;

export const selectProcessMetaInfo = createSelector(selectState, selectProcessId, (state, processId) => {
  return get(state, [processId, 'metaInfo'], {});
});

export const selectProcessActions = createSelector(selectState, selectProcessId, (state, instanceId) => {
  return get(state, [instanceId, 'actionsInfo'], {});
});

export const selectProcessVersions = createSelector(selectState, selectProcessId, (state, processId) => {
  return get(state, [processId, 'versions'], {});
});

export const selectProcessTabInfo = createSelector(selectState, selectProcessId, selectTabId, (state, processId, tabId) => {
  return get(state, [processId, tabId], {});
});
