import { put, select, takeLatest, takeEvery, call } from 'redux-saga/effects';

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
  removeDelegation
} from '../../actions/timesheet/mine';
import { selectUserName } from '../../selectors/user';
import { selectTMineUpdatingHours, selectTMineDelegatedTo } from '../../selectors/timesheet';
import CommonTimesheetConverter from '../../dto/timesheet/common';
import DelegationTimesheetConverter from '../../dto/timesheet/delegated';
import CommonTimesheetService from '../../services/timesheet/common';
import { DelegationTypes } from '../../constants/timesheet';

function* sagaGetMyTimesheetByParams({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserName);
    const { currentDate } = payload;

    const statuses = yield call(api.timesheetCommon.getTimesheetStatusList, {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });

    const status = CommonTimesheetConverter.getStatusForWeb(statuses);

    const calendar = yield call(api.timesheetCommon.getTimesheetCalendarEventsList, {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });
    const delegationStatus = yield call(api.timesheetDelegated.getDelegationInfo, { user: userName, delegationType: DelegationTypes.FILL });
    const deputy = DelegationTimesheetConverter.getDelegationInfo(delegationStatus.records);
    const calendarEvents = calendar[userName] || [];
    const mergedEvents = CommonTimesheetConverter.getCalendarEventsForWeb(calendarEvents);

    yield put(setMyTimesheetByParams({ status, mergedEvents, deputy }));
  } catch (e) {
    logger.error('[timesheetMine sagaGetMyTimesheetByParams saga] error', e);
  }
}

function* sagaGetStatus({ api, logger }, { payload }) {
  try {
    const userName = yield select(selectUserName);
    const { currentDate } = payload;

    const statuses = yield call(api.timesheetCommon.getTimesheetStatusList, {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames: [userName]
    });

    yield put(setStatus(CommonTimesheetConverter.getStatusForWeb(statuses)));
  } catch (e) {
    logger.error('[timesheetMine sagaGetStatus saga] error', e);
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
    logger.error('[timesheetMine sagaModifyStatus saga] error', e);
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
  } catch (e) {
    const updatingHoursState = yield select(selectTMineUpdatingHours);
    const thirdState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(thirdState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetMine sagaModifyStatus saga] error', e);
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
    logger.error('[timesheetMine sagaResetEventDayHours saga] error', e);
  }
}

function* sagaDelegateTo({ api, logger }, { payload }) {
  const deputy = DelegationTimesheetConverter.getDeputyData(payload.deputy);
  const userName = yield select(selectUserName);

  try {
    yield call(api.timesheetDelegated.setRecord, {
      userName,
      deputyName: deputy.userName,
      delegationType: payload.delegationType
    });

    yield put(setDelegatedTo(deputy));
  } catch (e) {
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_DELEGATE_TO));
    logger.error('[timesheetMine sagaDelegateTo saga] error', e);
  }
}

function* sagaRemoveDelegation({ api, logger }) {
  const userName = yield select(selectUserName);
  const deputyName = yield select(selectTMineDelegatedTo);

  try {
    yield call(api.timesheetDelegated.removeRecord, { userName, deputyName, delegationType: DelegationTypes.FILL });

    yield put(setDelegatedTo(DelegationTimesheetConverter.getDeputyData()));
  } catch (e) {
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_REMOVE_DELEGATED_TO));
    logger.error('[timesheetMine sagaRemoveDelegation saga] error', e);
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
