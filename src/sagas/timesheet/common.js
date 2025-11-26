import { call, put, select, takeLatest } from 'redux-saga/effects';

import { getTotalCounts, setTotalCounts } from '../../actions/timesheet/common';
import { TimesheetTypes } from '../../constants/timesheet';
import { selectUserName } from '../../selectors/user';

function* sagaGetTotalCounts({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserName);
    const { currentDate } = payload;

    const delegatedCount = yield call(api.timesheetCommon.getTotalCountDelegated, {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userName: userName
    });

    yield put(setTotalCounts({ [TimesheetTypes.DELEGATED]: delegatedCount }));
  } catch (e) {
    console.error('[timesheetCommon sagaGetTotalCounts saga] error', e);
  }
}

function* saga(ea) {
  yield takeLatest(getTotalCounts().type, sagaGetTotalCounts, ea);
}

export default saga;
