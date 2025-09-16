import get from 'lodash/get';
import { initialState } from '../reducers/comments';

export const selectAllComments = (state, recordRef) => {
  return get(state, ['comments', recordRef, 'comments']) || [];
};

export const selectStateByRecordRef = (state, recordRef) => {
  const ownState = state.comments[recordRef] || { ...initialState };

  return {
    fetchIsLoading: ownState.fetchIsLoading,
    saveIsLoading: ownState.sendingInProcess,
    hasMore: ownState.hasMore,
    totalCount: ownState.totalCount,
    errorMessage: ownState.errorMessage,
    comments: ownState.comments,
    actionFailed: ownState.actionFailed,
    isUploadingFile: ownState.isUploadingFile,
  };
};
