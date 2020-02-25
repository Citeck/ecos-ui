import { createAction } from 'redux-actions';

const prefix = 'webPage/';

export const initPage = createAction(prefix + 'INIT_PAGE');
export const getPageData = createAction(prefix + 'GET_PAGE_DATA');
export const setPageData = createAction(prefix + 'SET_PAGE_DATA');
export const changePageData = createAction(prefix + 'CHANGE_PAGE_DATA');
export const startLoadingPage = createAction(prefix + 'START_LOADING_PAGE');
export const loadedPage = createAction(prefix + 'LOADED_PAGE');
export const cancelPageLoading = createAction(prefix + 'CANCEL_PAGE_LOADING');
export const setError = createAction(prefix + 'SET_ERROR');
export const reloadPageData = createAction(prefix + 'RELOAD_PAGE_DATA');
export const backPageFromTransitionsHistory = createAction(prefix + 'BACK_PAGE_FROM_TRANSITIONS_HISTORY');
