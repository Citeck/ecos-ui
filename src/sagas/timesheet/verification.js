import { put, select, takeEvery, takeLatest, call } from 'redux-saga/effects';
import cloneDeep from 'lodash/cloneDeep';

import {
  getCalendarEvents,
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
import { setUsers } from '../../actions/timesheet/common';
import VerificationTimesheetService from '../../services/timesheet/verification';
import VerificationTimesheetConverter from '../../dto/timesheet/verification';
import CommonTimesheetService from '../../services/timesheet/common';
import { selectTVerificationUpdatingHours, selectTVerificationMergedList } from '../../selectors/timesheet';
import { TimesheetMessages } from '../../helpers/timesheet/dictionary';
import { selectUserName } from '../../selectors/user';

function* sagaGetVerificationTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate, status } = payload;

    const allUsers = VerificationTimesheetConverter.getUsersForWeb(
      yield call(api.timesheetCommon.getAllUsersByDate, {
        status,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      })
    );

    if (!allUsers.length) {
      yield put(setVerificationTimesheetByParams());
      return;
    }

    yield put(setUsers(allUsers));

    const currentList = yield select(selectTVerificationMergedList);
    const mergedList = VerificationTimesheetService.mergeList({
      currentList,
      newItem: allUsers,
      eventTypes: CommonTimesheetService.eventTypes
    });

    yield put(setVerificationTimesheetByParams({ mergedList }));
  } catch (e) {
    logger.error('[timesheetVerification sagaGetVerificationTimesheetByParams saga error', e.message);
  }
}

function* updateEvents({ value, number, userName, eventType }) {
  try {
    const list = cloneDeep(yield select(selectTVerificationMergedList));
    const itemIndex = list.findIndex(item => item.userName === userName);

    if (!~itemIndex) {
      return;
    }

    const eventsIndex = list[itemIndex].eventTypes.findIndex(event => event.name === eventType);

    if (!~eventsIndex) {
      return;
    }

    const event = list[itemIndex].eventTypes[eventsIndex];
    let dayIndex = event.days.findIndex(day => day.number === number);

    if (!~dayIndex) {
      event.days.push({ number, hours: value });
      dayIndex = event.days.length - 1;
    }

    if (!!value) {
      event.days[dayIndex].hours = value;
    } else {
      event.days.splice(dayIndex, 1);
    }

    yield put(setMergedList(list));
  } catch (e) {
    console.error('[timesheetVerification updateEvents] error', e.message);
  }
}

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTVerificationUpdatingHours);
  const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload);

  yield put(setUpdatingEventDayHours(firstState));

  try {
    yield call(api.timesheetCommon.modifyEventHours, { ...payload });

    const updatingHoursState = yield select(selectTVerificationUpdatingHours);
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(secondState));
    yield* updateEvents(payload);
  } catch (e) {
    const updatingHoursState = yield select(selectTVerificationUpdatingHours);
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
    const updatingHoursState = yield select(selectTVerificationUpdatingHours);
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(secondState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetVerification sagaResetEventDayHours saga] error', e.message);
  }
}

function* sagaGetCalendarEvents({ api, logger }, { payload }) {
  try {
    const calendarEvents = yield call(api.timesheetCommon.getTimesheetCalendarEventsByUserName, {
      month: payload.month,
      year: payload.year,
      userName: payload.userName
    });
    const currentList = yield select(selectTVerificationMergedList);
    const index = currentList.findIndex(item => item.userName === payload.userName);

    if (index === -1) {
      return;
    }

    currentList[index].eventTypes = VerificationTimesheetConverter.getCalendarEventsForWeb(calendarEvents.records);

    yield put(setVerificationTimesheetByParams({ mergedList: currentList }));
  } catch (e) {
    yield put(setLoading(false));
    logger.error('[timesheetVerification sagaGetCalendarEvents saga] error', e.message);
  }
}

function* sagaModifyTaskStatus({ api, logger }, { payload }) {
  try {
    const currentUser = yield select(selectUserName);
    const { outcome, taskId, userName, comment } = payload;

    const mergedList = yield select(selectTVerificationMergedList);

    yield call(api.timesheetCommon.changeTaskOwner, { taskId, currentUser });
    yield call(api.timesheetCommon.modifyStatus, {
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
  yield takeLatest(getCalendarEvents().type, sagaGetCalendarEvents, ea);
}

export default saga;
