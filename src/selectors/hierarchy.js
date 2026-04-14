import get from 'lodash/get';
import { createSelector } from 'reselect';

export const selectHierarchy = (state, key) => get(state, ['hierarchy', key]) || {};

export const selectIsHierarchyEnabled = createSelector(selectHierarchy, state => get(state, 'isEnabled', false));
