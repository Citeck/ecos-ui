import { put, takeEvery } from 'redux-saga/effects';

import { getReportData, setReportData } from '../actions/report';
import { reportDataPrepare, reportDataConvert } from '../dto/report';

function* sagaGetReportData({ api }, action) {
  try {
    const urgent = yield api.report.getReportData('urgent');
    const today = yield api.report.getReportData('today');
    const later = yield api.report.getReportData('later');

    const mergedResponseData = {
      urgent,
      today,
      later
    };

    const reportDataPrepared = reportDataPrepare(mergedResponseData);
    const reportData = reportDataConvert(reportDataPrepared);

    yield put(setReportData({ stateId: action.payload, reportData }));
  } catch (e) {
    console.error('[report sagaGetReportData saga error', e);
  }
}

function* reportSaga(ea) {
  yield takeEvery(getReportData().type, sagaGetReportData, ea);
}

export default reportSaga;
