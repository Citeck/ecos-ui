import { put, select, takeLatest } from 'redux-saga/effects';
import { getStatus, initMyTimesheetEnd, initMyTimesheetStart, setStatus } from '../../actions/timesheet/mine';
import { selectUserUserName } from '../../selectors/user';
import MyTimesheetConverter from '../../dto/timesheet/mine';

function* sagaInitSubordinatesTimesheet({ api, logger }) {
  try {
    const userName = yield select(selectUserUserName);
    const currentDate = new Date();
    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });

    const status = MyTimesheetConverter.getStatusForWeb(statuses);

    yield put(initMyTimesheetEnd({ status }));
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesList saga error', e.message);
  }
}

function* sagaGetStatus({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserUserName);
    const { currentDate } = payload;

    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: userName
    });

    yield put(setStatus(MyTimesheetConverter.getStatusForWeb(statuses)));
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesEventsList saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initMyTimesheetStart().type, sagaInitSubordinatesTimesheet, ea);
  yield takeLatest(getStatus().type, sagaGetStatus, ea);
}

export default saga;
