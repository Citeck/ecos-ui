import { createAction } from 'redux-actions';

import { WrapArgsType } from '@/types/store';
import { MLHtmlStringType } from '@/types/store/customWidgetHtml';

const prefix = 'widget-html/';

export const setEditorMode = createAction<WrapArgsType<boolean>>(prefix + 'SET_EDITOR_MODE');
export const setLoading = createAction<WrapArgsType<boolean>>(prefix + 'SET_LOADING');
export const setHtml = createAction<WrapArgsType<MLHtmlStringType>>(prefix + 'SET_HTML');

export const updateHtmlWidget = createAction<{ stateId: string; html: MLHtmlStringType }>(prefix + 'UPDATE_HTML_WIDGET');
