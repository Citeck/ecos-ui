import { createAction } from 'redux-actions';

const prefix = 'widget-html/';

export const setEditorMode = createAction(prefix + 'SET_EDITOR_MODE');
export const setLoading = createAction(prefix + 'SET_LOADING');
export const setHtml = createAction(prefix + 'SET_HTML');

export const updateHtmlWidget = createAction(prefix + 'UPDATE_HTML_WIDGET');
