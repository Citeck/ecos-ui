import { path } from 'ramda';
import { initialState } from '../reducers/comments';

export const selectAllComments = (state, nodeRef) => {
  return path(['comments', nodeRef, 'comments'], state) || [];
};

export const selectStateByNodeRef = (state, nodeRef) => {
  const ownState = state.comments[nodeRef] || { ...initialState };

  return {
    fetchIsLoading: ownState.fetchIsLoading,
    saveIsLoading: ownState.sendingInProcess,
    hasMore: ownState.hasMore,
    totalCount: ownState.totalCount,
    errorMessage: ownState.errorMessage,
    comments: ownState.comments
  };
};
