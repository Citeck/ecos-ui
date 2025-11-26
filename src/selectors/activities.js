import get from 'lodash/get';

import { initialState } from '../reducers/activities';

export const selectAllActivities = (state, recordRef) => {
  return get(state, ['activities', recordRef, 'activities']) || [];
};

export const selectStateByRecordRef = (state, recordRef) => {
  const ownState = state.activities[recordRef] || { ...initialState };

  return {
    fetchIsLoading: ownState.fetchIsLoading,
    saveIsLoading: ownState.sendingInProcess,
    hasMore: ownState.hasMore,
    totalCount: ownState.totalCount,
    errorMessage: ownState.errorMessage,
    activityTypes: ownState.activityTypes,
    activities: ownState.activities,
    actionFailed: ownState.actionFailed,
    isUploadingFile: ownState.isUploadingFile
  };
};
