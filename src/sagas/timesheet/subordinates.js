import { put, select, takeLatest } from 'redux-saga/effects';
import { TimesheetMessages } from '../../helpers/timesheet/dictionary';
import {
  getSubordinatesTimesheetByParams,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  setLoading,
  setMergedList,
  setPopupMessage,
  setSubordinatesTimesheetByParams,
  setUpdatingEventDayHours
} from '../../actions/timesheet/subordinates';
import { selectTSubordinatesMergedList, selectTSubordinatesUpdatingHours } from '../../selectors/timesheet';
import { selectUserName } from '../../selectors/user';
import SubordinatesTimesheetConverter from '../../dto/timesheet/subordinates';
import CommonTimesheetService from '../../services/timesheet/common';
import SubordinatesTimesheetService from '../../services/timesheet/subordinates';

function* sagaGetSubordinatesTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate, status } = payload;
    const userName = yield select(selectUserName);

    const subordinates = yield api.timesheetSubordinates.getSubordinatesList({ userName });

    const userNames = CommonTimesheetService.getUserNameList(subordinates.records);

    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames,
      status
    });

    const calendarEvents = yield api.timesheetCommon.getTimesheetCalendarEventsList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: userNames
    });

    const list = SubordinatesTimesheetService.mergeManyToOneList({
      subordinates: subordinates.records,
      calendarEvents,
      statuses: statuses.records
    });

    const mergedList = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);

    yield put(setSubordinatesTimesheetByParams({ mergedList }));
  } catch (e) {
    logger.error('[timesheetSubordinates sagaGetSubordinatesTimesheetByParams saga] error', e.message);
  }
}

function* sagaModifyTaskStatus({ api, logger }, { payload }) {
  try {
    const currentUser = yield select(selectUserName);
    const { outcome, taskId, userName, comment } = payload;

    const mergedList = yield select(selectTSubordinatesMergedList);

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
    logger.error('[timesheetSubordinates sagaModifyTaskStatus saga] error', e.message);
  }
}

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTSubordinatesUpdatingHours);
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
  const updatingHoursState = yield select(selectTSubordinatesUpdatingHours);

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
  yield takeLatest(getSubordinatesTimesheetByParams().type, sagaGetSubordinatesTimesheetByParams, ea);
  yield takeLatest(modifyStatus().type, sagaModifyTaskStatus, ea);
  yield takeLatest(modifyEventDayHours().type, sagaModifyEventDayHours, ea);
  yield takeLatest(resetEventDayHours().type, sagaResetEventDayHours, ea);
}

export default saga;
