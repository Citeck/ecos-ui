import { createAction } from 'redux-actions';

const prefix = 'charts-widget/';

export const getChartData = createAction(prefix + 'GET_CHART_DATA');
export const setChartData = createAction(prefix + 'SET_CHART_DATA');
export const setError = createAction(prefix + 'SET_ERROR');

export const setLoading = createAction(prefix + 'SET_LOADING');
