import { createSelector } from 'reselect';

export const selectAllComments = state => state.comments.comments;
