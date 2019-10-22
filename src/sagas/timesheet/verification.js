import { put, takeLatest } from 'redux-saga/effects';
import { getVerificationTimesheetByParams, setVerificationTimesheetByParams } from '../../actions/timesheet/verification';
import VerificationTimesheetService from '../../services/timesheet/verification';
import VerificationTimesheetConverter from '../../dto/timesheet/verification';
import CommonTimesheetService from '../../services/timesheet/common';

function* sagaGetVerificationTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate, status } = payload;

    const requestList = yield api.timesheetVerification.getRequestListByStatus({
      status,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    });

    const userNamesPure = CommonTimesheetService.getUserNameList(requestList.records);

    const peopleList = yield api.timesheetCommon.getInfoPeopleList({ userNames: userNamesPure });

    const calendarEvents = yield api.timesheetCommon.getTimesheetCalendarEventsList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: userNamesPure
    });

    const list = VerificationTimesheetService.mergeManyToOneList({
      peopleList: peopleList.records,
      calendarEvents,
      requestList: requestList.records
    });

    const mergedList = VerificationTimesheetConverter.getVerificationEventsListForWeb(list);

    yield put(setVerificationTimesheetByParams({ status, mergedList, calendarEvents }));
  } catch (e) {
    logger.error('[timesheetVerification sagaGetVerificationTimesheetByParams saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getVerificationTimesheetByParams().type, sagaGetVerificationTimesheetByParams, ea);
}

export default saga;
