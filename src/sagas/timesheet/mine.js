import { put, select, takeLatest, takeEvery, call } from 'redux-saga/effects';
import get from 'lodash/get';

import { TimesheetMessages } from '../../helpers/timesheet/dictionary';
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
  setUpdatingStatus,
  delegateTo,
  setDelegatedTo,
  removeDelegation,
  setEvents
} from '../../actions/timesheet/mine';
import { selectUserName } from '../../selectors/user';
import { selectTMineUpdatingHours, selectTMineDelegatedTo, selectTMineEvents } from '../../selectors/timesheet';
import CommonTimesheetConverter from '../../dto/timesheet/common';
import DelegationTimesheetConverter from '../../dto/timesheet/delegated';
import CommonTimesheetService from '../../services/timesheet/common';
import { DelegationTypes } from '../../constants/timesheet';
import { deepClone } from '../../helpers/util';

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
    const delegationStatus = yield api.timesheetDelegated.getDelegationInfo({ user: userName, delegationType: DelegationTypes.FILL });
    const deputy = DelegationTimesheetConverter.getDelegationInfo(delegationStatus.records);
    const calendarEvents = calendar[userName] || [];
    const mergedEvents = CommonTimesheetConverter.getCalendarEventsForWeb(calendarEvents);

    yield put(setMyTimesheetByParams({ status, mergedEvents, deputy }));
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

    yield call(api.timesheetCommon.changeTaskOwner, { taskId, currentUser });
    yield call(api.timesheetCommon.modifyStatus, {
      outcome,
      taskId,
      currentUser,
      comment
    });
    yield put(setUpdatingStatus(true));
  } catch (e) {
    yield put(setStatus(payload.status));
    yield put(setUpdatingStatus(false));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_STATUS));
    logger.error('[timesheetMine sagaModifyStatus saga] error', e.message);
  }
}

function* updateEvents({ value, number, userName }) {
  try {
    const events = deepClone(yield select(selectTMineEvents));
    const event = get(events, `[${userName}]`, []);
    let dayIndex = get(event, 'days', []).findIndex(day => day.number === number);

    if (!~dayIndex) {
      event.days.push({ number, hours: value });
      dayIndex = event.days.length - 1;
    }

    if (!!value) {
      event.days[dayIndex].hours = value;
    } else {
      event.days.splice(dayIndex, 1);
    }

    yield put(setEvents(events));
  } catch (e) {
    console.error('[timesheetMine updateEvents] error', e.message);
  }
}

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  const userName = yield select(selectUserName);
  const updatingHoursState = yield select(selectTMineUpdatingHours);
  const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload);

  yield put(setUpdatingEventDayHours(firstState));

  try {
    yield call(api.timesheetCommon.modifyEventHours, { ...payload, userName });

    const updatingHoursState = yield select(selectTMineUpdatingHours);
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(secondState));
    yield* updateEvents(payload);
  } catch (e) {
    const updatingHoursState = yield select(selectTMineUpdatingHours);
    const thirdState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(thirdState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetMine sagaModifyStatus saga] error', e.message);
  }
}

function* sagaResetEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTMineUpdatingHours);

  try {
    const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(firstState));
  } catch (e) {
    const updatingHoursState = yield select(selectTMineUpdatingHours);
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(secondState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetMine sagaResetEventDayHours saga] error', e.message);
  }
}

function* sagaDelegateTo({ api, logger }, { payload }) {
  const deputy = DelegationTimesheetConverter.getDeputyData(payload.deputy);
  const userName = yield select(selectUserName);

  try {
    yield api.timesheetDelegated.setRecord({
      userName,
      deputyName: deputy.userName,
      delegationType: payload.delegationType
    });

    yield put(setDelegatedTo(deputy));
  } catch (e) {
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_DELEGATE_TO));
    logger.error('[timesheetMine sagaDelegateTo saga] error', e.message);
  }
}

function* sagaRemoveDelegation({ api, logger }) {
  const userName = yield select(selectUserName);
  const deputyName = yield select(selectTMineDelegatedTo);

  try {
    yield api.timesheetDelegated.removeRecord({ userName, deputyName, delegationType: DelegationTypes.FILL });

    yield put(setDelegatedTo(DelegationTimesheetConverter.getDeputyData()));
  } catch (e) {
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_REMOVE_DELEGATED_TO));
    logger.error('[timesheetMine sagaRemoveDelegation saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getStatus().type, sagaGetStatus, ea);
  yield takeLatest(modifyStatus().type, sagaModifyStatus, ea);
  yield takeLatest(getMyTimesheetByParams().type, sagaGetMyTimesheetByParams, ea);
  yield takeEvery(modifyEventDayHours().type, sagaModifyEventDayHours, ea);
  yield takeLatest(resetEventDayHours().type, sagaResetEventDayHours, ea);
  yield takeLatest(delegateTo().type, sagaDelegateTo, ea);
  yield takeLatest(removeDelegation().type, sagaRemoveDelegation, ea);
}

export default saga;
