import { createAction } from 'redux-actions';

const prefix = 'header/';

export const fetchCreateCaseWidgetData = createAction(prefix + 'CREATE_CASE_WIDGET_FETCH_DATA');
export const setCreateCaseWidgetItems = createAction(prefix + 'CREATE_CASE_WIDGET_SET_ITEMS');
export const setCreateCaseWidgetIsCascade = createAction(
  prefix + 'CREATE_CASE_WIDGET_SET_IS_CASCADE'
);
