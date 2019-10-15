import { put, select, takeLatest } from 'redux-saga/effects';
import { TimesheetMessages } from '../../helpers/timesheet/constants';
import {
  getSubordinatesTimesheetByParams,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  setLoading,
  setMergedList,
  setPopupMessage,
  setStatusList,
  setSubordinatesTimesheetByParams,
  setUpdatingEventDayHours
} from '../../actions/timesheet/subordinates';
import {
  selectTimesheetSubordinatesMergedList,
  selectTimesheetSubordinatesPeople,
  selectTimesheetSubordinatesStatuses,
  selectTimesheetSubordinatesUpdatingHours
} from '../../selectors/timesheet';
import SubordinatesTimesheetService from '../../services/timesheet/subordinates';
import CommonTimesheetService from '../../services/timesheet/common';
import { selectUserUserName } from '../../selectors/user';
import SubordinatesTimesheetConverter from '../../dto/timesheet/subordinates';
import CommonTimesheetConverter from '../../dto/timesheet/common';

function* sagaInitSubordinatesTimesheet({ api, logger }) {
  try {
    const userName = yield select(selectUserUserName);
    const subordinates = yield api.timesheetSubordinates.getSubordinatesList({ userName });
    const userNames = SubordinatesTimesheetService.getUserNameList(subordinates.records);

    const currentDate = new Date();
    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames
    });

    const calendarEvents = yield api.timesheetCommon.getTimesheetCalendarEventsList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: userNames
    });

    const list = SubordinatesTimesheetService.mergeToSubordinatesEventsList({
      subordinates: subordinates.records,
      calendarEvents,
      statuses: statuses.records
    });

    const mergedList = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);

    yield put(initSubordinatesTimesheetEnd({ mergedList, userNames, subordinates, calendarEvents, statuses }));
  } catch (e) {
    logger.error('[timesheetSubordinates sagaInitSubordinatesTimesheet saga] error', e.message);
  }
}

function* sagaGetSubordinatesTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate } = payload;
    const subordinates = yield select(selectTimesheetSubordinatesPeople);

    const userNames = SubordinatesTimesheetService.getUserNameList(subordinates);
    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames
    });

    const calendarEvents = yield api.timesheetCommon.getTimesheetCalendarEventsList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: userNames
    });

    const list = SubordinatesTimesheetService.mergeToSubordinatesEventsList({
      subordinates,
      calendarEvents,
      statuses: statuses.records
    });

    const mergedList = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);

    yield put(setSubordinatesTimesheetByParams({ mergedList, calendarEvents, statuses }));
  } catch (e) {
    logger.error('[timesheetSubordinates sagaGetSubordinatesTimesheetByParams saga] error', e.message);
  }
}

function* sagaModifyTaskStatus({ api, logger }, { payload }) {
  try {
    const currentUser = yield select(selectUserUserName);
    const { outcome, taskId, userName, currentDate } = payload;

    const mergedList = yield select(selectTimesheetSubordinatesMergedList);
    const statuses = yield select(selectTimesheetSubordinatesStatuses);

    yield api.timesheetCommon.modifyStatus({
      outcome,
      taskId,
      currentUser
    });

    const statusRes = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });

    const status = CommonTimesheetConverter.getStatusForWeb(statusRes);
    const listsAfter = SubordinatesTimesheetService.setUserStatusInLists({
      mergedList,
      statuses,
      userName,
      status: status.key
    });
    yield put(setMergedList(listsAfter.mergedList));
    yield put(setStatusList(listsAfter.statuses));
  } catch (e) {
    yield put(setLoading(false));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_STATUS));
    logger.error('[timesheetSubordinates sagaModifyTaskStatus saga] error', e.message);
  }
}

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTimesheetSubordinatesUpdatingHours);
  const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload);

  yield put(setUpdatingEventDayHours(firstState));

  try {
    yield api.timesheetCommon.modifyEventHours({ ...payload });

    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(secondState));
  } catch (e) {
    const thirdState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(thirdState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetSubordinates sagaModifyStatus saga] error', e.message);
  }
}

function* sagaResetEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTimesheetSubordinatesUpdatingHours);

  try {
    const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(firstState));
  } catch (e) {
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(secondState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetSubordinates sagaResetEventDayHours saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSubordinatesTimesheetStart().type, sagaInitSubordinatesTimesheet, ea);
  yield takeLatest(getSubordinatesTimesheetByParams().type, sagaGetSubordinatesTimesheetByParams, ea);
  yield takeLatest(modifyStatus().type, sagaModifyTaskStatus, ea);
  yield takeLatest(modifyEventDayHours().type, sagaModifyEventDayHours, ea);
  yield takeLatest(resetEventDayHours().type, sagaResetEventDayHours, ea);
}

export default saga;
