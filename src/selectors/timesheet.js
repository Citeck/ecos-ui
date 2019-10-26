export const selectTSubordinatesMergedList = state => state.timesheetSubordinates.mergedList || [];
export const selectTSubordinatesUpdatingHours = state => state.timesheetSubordinates.updatingHours || {};
export const selectTSubordinatesDelegatedTo = state => state.timesheetSubordinates.delegatedToUserName || '';

export const selectTMineUpdatingHours = state => state.timesheetMine.updatingHours || {};
export const selectTMineDelegatedTo = state => state.timesheetMine.delegatedToUserName || '';

export const selectTVerificationMergedList = state => state.timesheetVerification.mergedList || {};

export const selectTVerificationUpdatingHours = state => state.timesheetVerification.updatingHours || {};
export const selectTDelegatedMergedList = state => state.timesheetDelegated.mergedList || {};

export const selectTDelegatedUpdatingHours = state => state.timesheetDelegated.updatingHours || {};
