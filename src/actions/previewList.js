import { createAction } from 'redux-actions';

const prefix = 'previewList/';

export const setIsEnabledPreviewList = createAction(prefix + 'SET_IS_ENABLED_PREVIEW');

export const setPreviewListConfig = createAction(prefix + 'SET_PREVIEW_LIST_CONFIG');
export const setPreviewList = createAction(prefix + 'SET_PREVIEW_LIST');
export const setLoadingPreviewList = createAction(prefix + 'SET_LOADING_PREVIEW_LIST');

export const initPreviewList = createAction(prefix + 'INIT_PREVIEW_LIST');
