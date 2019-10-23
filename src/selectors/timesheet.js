export const selectTSubordinatesMergedList = state => state.timesheetSubordinates.mergedList || [];
export const selectTSubordinatesUpdatingHours = state => state.timesheetSubordinates.updatingHours || {};

export const selectTMineUpdatingHours = state => state.timesheetMine.updatingHours || {};

export const selectTVerificationMergedList = state => state.timesheetVerification.mergedList || {};
export const selectTVerificationUpdatingHours = state => state.timesheetVerification.updatingHours || {};

export const selectTDelegatedUpdatingHours = state => state.timesheetDelegated.updatingHours || {};
