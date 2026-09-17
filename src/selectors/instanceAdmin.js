import { createSelector } from 'reselect';

import get from 'lodash/get';

/**
 * A single stable default for every "nothing stored yet" answer (COREDEV-492).
 *
 * A fresh `{}` per call would be a new reference on every store change, so connected components
 * would see their props change on every dispatch and effects keyed on those props would re-fire
 * forever. Consumers only read from these objects, never mutate them.
 */
const EMPTY_OBJECT = Object.freeze({});

export const selectState = state => state.instanceAdmin;
export const selectInstanceId = (_, props) => props.instanceId;
export const selectTabId = (_, props) => props.tabId;

/**
 * Paths are ARRAYS on purpose: `instanceId` is a record ref (`emodel/person@jane.doe`) and
 * a string path would be split by lodash on every dot and bracket, so the stored entry would never
 * be found.
 */
export const selectInstanceActions = createSelector(selectState, selectInstanceId, (state, instanceId) => {
  return get(state, [instanceId, 'actionsInfo'], EMPTY_OBJECT);
});

export const selectInstanceMetaInfo = createSelector(selectState, selectInstanceId, (state, instanceId) => {
  return get(state, [instanceId, 'metaInfo'], EMPTY_OBJECT);
});

export const selectInstanceTabInfo = createSelector(selectState, selectInstanceId, selectTabId, (state, instanceId, tabId) => {
  return get(state, [instanceId, tabId], EMPTY_OBJECT);
});
