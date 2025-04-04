import { call, put, takeEvery } from 'redux-saga/effects';

import { getChartData, setChartData, setError, setLoading } from '../actions/charts';

function* sagaGetChartData({ api }, { payload: { stateId, typeRef, groupByParams, aggregationParam, selectedPreset } }) {
  try {
    const chartData = yield call(api.charts.getChartData, typeRef, groupByParams, aggregationParam, selectedPreset);

    yield put(setChartData({ stateId, chartData }));
    yield put(setError({ stateId, error: null }));
  } catch (error) {
    yield put(setChartData({ stateId, chartData: [] }));
    yield put(setError({ stateId, error }));
    console.error('[charts-widget/sagaGetChartData saga] error', error);
  } finally {
    yield put(setLoading({ stateId, isLoading: false }));
  }
}

function* chartsSaga(ea) {
  yield takeEvery(getChartData().type, sagaGetChartData, ea);
}

export default chartsSaga;
