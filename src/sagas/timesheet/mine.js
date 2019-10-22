import { put, select, takeLatest } from 'redux-saga/effects';
import { TimesheetMessages } from '../../helpers/timesheet/constants';
import {
  getMyTimesheetByParams,
  getStatus,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  setMyTimesheetByParams,
  setPopupMessage,
  setStatus,
  setUpdatingEventDayHours,
  setUpdatingStatus
} from '../../actions/timesheet/mine';
import { selectUserName } from '../../selectors/user';
import { selectTimesheetMineUpdatingHours } from '../../selectors/timesheet';
import CommonTimesheetConverter from '../../dto/timesheet/common';
import CommonTimesheetService from '../../services/timesheet/common';

function* sagaGetMyTimesheetByParams({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserName);
    const { currentDate } = payload;

    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });

    const status = CommonTimesheetConverter.getStatusForWeb(statuses);

    const calendar = yield api.timesheetCommon.getTimesheetCalendarEventsList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });

    const calendarEvents = calendar[userName] || [];

    const mergedEvents = CommonTimesheetConverter.getCalendarEventsForWeb(calendarEvents);

    yield put(setMyTimesheetByParams({ status, mergedEvents, calendarEvents }));
  } catch (e) {
    logger.error('[timesheetMine sagaGetMyTimesheetByParams saga] error', e.message);
  }
}

function* sagaGetStatus({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserName);
    const { currentDate } = payload;

    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });

    yield put(setStatus(CommonTimesheetConverter.getStatusForWeb(statuses)));
  } catch (e) {
    logger.error('[timesheetMine sagaGetStatus saga] error', e.message);
  }
}

function* sagaModifyStatus({ api, logger }, { payload }) {
  try {
    const currentUser = yield select(selectUserName);
    const {
      outcome,
      status: { taskId },
      comment
    } = payload;

    yield api.timesheetCommon.modifyStatus({
      outcome,
      taskId,
      currentUser,
      comment
    });
    yield put(setUpdatingStatus(true));
  } catch (e) {
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_STATUS));
    logger.error('[timesheetMine sagaModifyStatus saga] error', e.message);
  }
}

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  const userName = yield select(selectUserName);
  const updatingHoursState = yield select(selectTimesheetMineUpdatingHours);
  const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload);

  yield put(setUpdatingEventDayHours(firstState));

  try {
    yield api.timesheetCommon.modifyEventHours({ ...payload, userName });

    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(secondState));
  } catch (e) {
    const thirdState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(thirdState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetMine sagaModifyStatus saga] error', e.message);
  }
}

function* sagaResetEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTimesheetMineUpdatingHours);

  try {
    const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(firstState));
  } catch (e) {
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(secondState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetMine sagaResetEventDayHours saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getStatus().type, sagaGetStatus, ea);
  yield takeLatest(modifyStatus().type, sagaModifyStatus, ea);
  yield takeLatest(getMyTimesheetByParams().type, sagaGetMyTimesheetByParams, ea);
  yield takeLatest(modifyEventDayHours().type, sagaModifyEventDayHours, ea);
  yield takeLatest(resetEventDayHours().type, sagaResetEventDayHours, ea);
}

export default saga;
