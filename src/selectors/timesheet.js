import { createSelector } from 'reselect';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

const selectVerification = state => get(state, 'timesheetVerification', {});

export const selectTSubordinatesMergedList = state => state.timesheetSubordinates.mergedList || [];
export const selectTSubordinatesUpdatingHours = state => state.timesheetSubordinates.updatingHours || {};
export const selectTSubordinatesDelegatedTo = state => state.timesheetSubordinates.delegatedToUserName || '';
export const selectTSubordinatesList = state => state.timesheetSubordinates.mergedList || [];

export const selectTMineUpdatingHours = state => state.timesheetMine.updatingHours || {};
export const selectTMineDelegatedTo = state => state.timesheetMine.delegatedToUserName || '';
export const selectTMineEvents = state => state.timesheetMine.mergedEvents || [];

export const selectTVerificationMergedList = createSelector(
  selectVerification,
  verification => cloneDeep(get(verification, 'mergedList', []))
);

export const selectTVerificationUpdatingHours = state => state.timesheetVerification.updatingHours || {};
export const selectTDelegatedMergedList = state => state.timesheetDelegated.mergedList || {};

export const selectTDelegatedUpdatingHours = state => state.timesheetDelegated.updatingHours || {};
