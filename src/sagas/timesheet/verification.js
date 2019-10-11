import { put, takeLatest } from 'redux-saga/effects';
import {
  getVerificationTimesheetByParams,
  initVerificationTimesheetStart,
  setVerificationTimesheetByParams
} from '../../actions/timesheet/verification';
import VerificationTimesheetService from '../../services/timesheet/verification';
import VerificationTimesheetConverter from '../../dto/timesheet/verification';

function* sagaInitVerificationTimesheet({ api, logger }, { payload }) {
  try {
    const { status } = payload;
    const currentDate = new Date();

    yield put(getVerificationTimesheetByParams({ status, currentDate }));
  } catch (e) {
    logger.error('[timesheetVerification sagaInitVerificationTimesheet saga error', e.message);
  }
}

function* sagaGetVerificationTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate, status } = payload;

    const requestList = yield api.timesheetVerification.getRequestListByStatus({
      status,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    });

    const userNamesPure = VerificationTimesheetService.getUserNameList(requestList.records);

    const infoPeopleList = yield api.timesheetVerification.getInfoPeopleList({ userNames: userNamesPure });

    const calendarEvents = yield api.timesheetCommon.getTimesheetCalendarEventsList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: userNamesPure
    });

    const list = VerificationTimesheetService.mergeToVerificationEventsList({
      infoPeopleList: infoPeopleList.records,
      calendarEvents,
      requestList: requestList.records
    });

    console.log('list', list);
    const mergedList = VerificationTimesheetConverter.getVerificationEventsListForWeb(list);
    yield put(setVerificationTimesheetByParams({ status, mergedList, calendarEvents }));
  } catch (e) {
    logger.error('[timesheetVerification sagaGetVerificationTimesheetByParams saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initVerificationTimesheetStart().type, sagaInitVerificationTimesheet, ea);
  yield takeLatest(getVerificationTimesheetByParams().type, sagaGetVerificationTimesheetByParams, ea);
}

export default saga;
