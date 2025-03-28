import get from 'lodash/get';
import { createSelector } from 'reselect';

import { initialState } from '@/reducers/previewList';

const prefix = 'previewList';

export const selectPreviewList = (state, key) => get(state, [prefix, key]) || { ...initialState };

export const selectIsEnabledPreviewList = createSelector(selectPreviewList, state => get(state, 'isEnabled') || false);
export const selectIsLoadingPreviewList = createSelector(selectPreviewList, state => get(state, 'isLoading') || false);
export const selectIsInitiatedPreviewList = createSelector(selectPreviewList, state => get(state, 'isInitiated') || false);
export const selectPreviewListConfig = createSelector(selectPreviewList, state => get(state, 'config') || null);

export const selectPreviewListProps = createSelector(
  [selectIsEnabledPreviewList, selectPreviewListConfig, selectIsLoadingPreviewList, selectIsInitiatedPreviewList],
  (isEnabled, previewListConfig, isLoadingPreviewList, isInitiatedPreviewList) => ({
    isEnabled,
    previewListConfig,
    isLoadingPreviewList,
    isInitiatedPreviewList
  })
);
