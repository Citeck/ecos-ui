import { handleActions } from 'redux-actions';

import { getChartData, setChartData, setError, setLoading } from '../actions/charts';
import { startLoading, updateState } from '../helpers/redux';

export const initialState = {
  isLoading: false,
  error: null,

  chartData: []
};

Object.freeze(initialState);

export default handleActions(
  {
    [getChartData]: startLoading(initialState),
    [setChartData]: (state, { payload: { stateId, chartData } }) => updateState(state, stateId, { chartData }),
    [setError]: (state, { payload: { stateId, error } }) => updateState(state, stateId, { error }),

    [setLoading]: (state, { payload: { stateId, isLoading } }) => updateState(state, stateId, { isLoading })
  },
  initialState
);
