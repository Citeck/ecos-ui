import { put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  getVerificationTimesheetByParams,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  setLoading,
  setMergedList,
  setPopupMessage,
  setUpdatingEventDayHours,
  setVerificationTimesheetByParams
} from '../../actions/timesheet/verification';
import VerificationTimesheetService from '../../services/timesheet/verification';
import VerificationTimesheetConverter from '../../dto/timesheet/verification';
import CommonTimesheetService from '../../services/timesheet/common';
import {
  selectTSubordinatesUpdatingHours,
  selectTVerificationMergedList,
  selectTVerificationUpdatingHours
} from '../../selectors/timesheet';
import { TimesheetMessages } from '../../helpers/timesheet/dictionary';
import { selectUserName } from '../../selectors/user';

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

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTVerificationUpdatingHours);
  const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload);

  yield put(setUpdatingEventDayHours(firstState));

  try {
    yield api.timesheetCommon.modifyEventHours({ ...payload });

    const updatingHoursState = yield select(selectTSubordinatesUpdatingHours);
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(secondState));
  } catch (e) {
    const updatingHoursState = yield select(selectTSubordinatesUpdatingHours);
    const thirdState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(thirdState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetVerification sagaModifyStatus saga] error', e.message);
  }
}

function* sagaResetEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTVerificationUpdatingHours);

  try {
    const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(firstState));
  } catch (e) {
    const updatingHoursState = yield select(selectTSubordinatesUpdatingHours);
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(secondState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetVerification sagaResetEventDayHours saga] error', e.message);
  }
}

function* sagaModifyTaskStatus({ api, logger }, { payload }) {
  try {
    const currentUser = yield select(selectUserName);
    const { outcome, taskId, userName, comment } = payload;

    const mergedList = yield select(selectTVerificationMergedList);

    yield api.timesheetCommon.modifyStatus({
      outcome,
      taskId,
      currentUser,
      comment
    });

    const newMergedList = CommonTimesheetService.deleteRecordLocalByUserName(mergedList, userName);

    yield put(setMergedList(newMergedList));
  } catch (e) {
    yield put(setLoading(false));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_STATUS));
    logger.error('[timesheetVerification sagaModifyTaskStatus saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getVerificationTimesheetByParams().type, sagaGetVerificationTimesheetByParams, ea);
  yield takeEvery(modifyEventDayHours().type, sagaModifyEventDayHours, ea);
  yield takeLatest(resetEventDayHours().type, sagaResetEventDayHours, ea);
  yield takeLatest(modifyStatus().type, sagaModifyTaskStatus, ea);
}

export default saga;
