import { put, select, takeLatest } from 'redux-saga/effects';
import { TimesheetMessages } from '../../helpers/timesheet/constants';
import {
  getMyTimesheetByParams,
  getStatus,
  initMyTimesheetEnd,
  initMyTimesheetStart,
  modifyEventDayHours,
  modifyStatus,
  setPopupMessage,
  setStatus
} from '../../actions/timesheet/mine';
import { selectUserUserName } from '../../selectors/user';
import CommonTimesheetConverter from '../../dto/timesheet/common';

function* sagaInitMyTimesheet({ api, logger }) {
  try {
    const currentDate = new Date();

    yield put(getMyTimesheetByParams({ currentDate }));
  } catch (e) {
    logger.error('[timesheetMine sagaInitMyTimesheet saga error', e.message);
  }
}

function* sagaGetMyTimesheetByParams({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserUserName);
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

    yield put(initMyTimesheetEnd({ status, mergedEvents, calendarEvents }));
  } catch (e) {
    logger.error('[timesheetMine sagaGetMyTimesheetByParams saga error', e.message);
  }
}

function* sagaGetStatus({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserUserName);
    const { currentDate } = payload;

    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });

    yield put(setStatus(CommonTimesheetConverter.getStatusForWeb(statuses)));
  } catch (e) {
    logger.error('[timesheetMine sagaGetStatus saga error', e.message);
  }
}

function* sagaModifyStatus({ api, logger }, { payload }) {
  try {
    const {
      outcome,
      status: { taskId },
      currentDate
    } = payload;

    yield api.timesheetCommon.modifyStatus({
      outcome,
      taskId
    });

    yield put(getStatus({ currentDate }));
  } catch (e) {
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_STATUS));
    logger.error('[timesheetMine sagaModifyStatus saga error', e.message);
  }
}

function* sagaModifyEventHours({ api, logger }, { payload }) {
  try {
    const { value, date, eventType } = payload;
    const userName = yield select(selectUserUserName);

    yield api.timesheetCommon.modifyEventHours({ userName, date, eventType, value });
  } catch (e) {
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetMine sagaModifyStatus saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initMyTimesheetStart().type, sagaInitMyTimesheet, ea);
  yield takeLatest(getStatus().type, sagaGetStatus, ea);
  yield takeLatest(modifyStatus().type, sagaModifyStatus, ea);
  yield takeLatest(getMyTimesheetByParams().type, sagaGetMyTimesheetByParams, ea);
  yield takeLatest(modifyEventDayHours().type, sagaModifyEventHours, ea);
}

export default saga;
