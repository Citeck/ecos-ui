import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';

import {
  declineDelegation,
  getDelegatedDeputies,
  getDelegatedTimesheetByParams,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  setDelegatedDeputies,
  setDelegatedTimesheetByParams,
  setLoading,
  setMergedList,
  setPopupMessage,
  setUpdatingEventDayHours
} from '../../actions/timesheet/delegated';
import { DelegationTypes } from '../../constants/timesheet';
import DelegatedTimesheetConverter from '../../dto/timesheet/delegated';
import { TimesheetMessages } from '../../helpers/timesheet/dictionary';
import { deepClone } from '../../helpers/util';
import { selectTDelegatedMergedList, selectTDelegatedUpdatingHours } from '../../selectors/timesheet';
import { selectUserName } from '../../selectors/user';
import CommonTimesheetService from '../../services/timesheet/common';
import DelegatedTimesheetService from '../../services/timesheet/delegated';

function* sagaGetDelegatedTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate, delegationType, status } = payload;
    const userName = yield select(selectUserName);
    const requestList = yield call(api.timesheetDelegated.getRequestListByType, {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userName,
      delegationType,
      statuses: Array.isArray(status) ? status : [status]
    });

    const userNames = CommonTimesheetService.getUserNameList(requestList.records);

    const peopleList = yield call(api.timesheetCommon.getInfoPeopleList, { userNames });

    const innerCounts = yield call(api.timesheetDelegated.getTotalCountsForTypes, {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userName
    });

    const calendarEvents = yield call(api.timesheetCommon.getTimesheetCalendarEventsList, {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: userNames
    });

    const list = DelegatedTimesheetService.mergeManyToOneList({
      requestList: requestList.records,
      peopleList: peopleList.records,
      calendarEvents
    });

    const mergedList = DelegatedTimesheetConverter.getDelegatedEventsListForWeb(list);

    yield put(setDelegatedTimesheetByParams({ mergedList, innerCounts }));
  } catch (e) {
    console.error('[timesheetDelegated sagaGetDelegatedTimesheetByParams saga] error', e);
  }
}

function* updateEvents({ value, number, userName, eventType }) {
  try {
    const list = deepClone(yield select(selectTDelegatedMergedList));
    const subordinateIndex = list.findIndex(item => item.userName === userName);

    if (!~subordinateIndex) {
      return;
    }

    const eventsIndex = list[subordinateIndex].eventTypes.findIndex(event => event.name === eventType);

    if (!~eventsIndex) {
      return;
    }

    const event = list[subordinateIndex].eventTypes[eventsIndex];
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
    console.error('[timesheetDelegated updateEvents] error', e.message);
  }
}

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTDelegatedUpdatingHours);
  const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload);

  yield put(setUpdatingEventDayHours(firstState));

  try {
    yield call(api.timesheetCommon.modifyEventHours, { ...payload });

    const updatingHoursState = yield select(selectTDelegatedUpdatingHours);
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(secondState));
    yield* updateEvents(payload);
  } catch (e) {
    const updatingHoursState = yield select(selectTDelegatedUpdatingHours);
    const thirdState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(thirdState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    console.error('[timesheetDelegated sagaModifyStatus saga] error', e);
  }
}

function* sagaResetEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTDelegatedUpdatingHours);

  try {
    const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(firstState));
  } catch (e) {
    const updatingHoursState = yield select(selectTDelegatedUpdatingHours);
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(secondState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    console.error('[timesheetDelegated sagaResetEventDayHours saga] error', e);
  }
}

function* sagaModifyTaskStatus({ api, logger }, { payload }) {
  try {
    const currentUser = yield select(selectUserName);
    const mergedList = yield select(selectTDelegatedMergedList);
    const { outcome, taskId, userName, comment } = payload;

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
    console.error('[timesheetDelegated sagaModifyTaskStatus saga] error', e);
  }
}

function* sagaDeclineDelegation({ api, logger }, { payload }) {
  const { userName, delegationType } = payload;
  const authorized = yield select(selectUserName);

  let _deputyName = '';
  let _userName = '';

  if (delegationType === DelegationTypes.FILL) {
    _deputyName = authorized;
    _userName = userName;
  } else if (delegationType === DelegationTypes.APPROVE) {
    _deputyName = userName;
    _userName = authorized;
  } else {
    return;
  }

  try {
    const mergedList = yield select(selectTDelegatedMergedList);

    yield call(api.timesheetDelegated.removeRecord, {
      userName: _userName,
      delegationType,
      deputyName: _deputyName
    });

    const newMergedList = CommonTimesheetService.deleteRecordLocalByUserName(mergedList, userName);

    yield put(setMergedList(newMergedList));
  } catch (e) {
    yield put(setLoading(false));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_STATUS));
    console.error('[timesheetDelegated sagaModifyTaskStatus saga] error', e);
  }
}

function* sagaGetDelegatedDeputies({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserName);
    const { type } = payload;
    const result = yield call(api.timesheetDelegated.getDeputyList, {
      userName,
      type
    });
    const deputyList = DelegatedTimesheetConverter.getDeputyListForWeb(result.records);

    yield put(setDelegatedDeputies(deputyList));
  } catch (e) {
    yield put(setDelegatedDeputies([]));
    console.error('[timesheetDelegated sagaModifyTaskStatus saga] error', e);
  }
}

function* saga(ea) {
  yield takeLatest(getDelegatedTimesheetByParams().type, sagaGetDelegatedTimesheetByParams, ea);
  yield takeEvery(modifyEventDayHours().type, sagaModifyEventDayHours, ea);
  yield takeLatest(resetEventDayHours().type, sagaResetEventDayHours, ea);
  yield takeLatest(modifyStatus().type, sagaModifyTaskStatus, ea);
  yield takeLatest(declineDelegation().type, sagaDeclineDelegation, ea);
  yield takeLatest(getDelegatedDeputies().type, sagaGetDelegatedDeputies, ea);
}

export default saga;
