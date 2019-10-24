import { put, select, takeLatest } from 'redux-saga/effects';
import { TimesheetMessages } from '../../helpers/timesheet/dictionary';
import {
  getDelegatedTimesheetByParams,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  setDelegatedTimesheetByParams,
  setLoading,
  setMergedList,
  setPopupMessage,
  setUpdatingEventDayHours
} from '../../actions/timesheet/delegated';
import { selectUserName } from '../../selectors/user';
import { selectTDelegatedMergedList, selectTDelegatedUpdatingHours } from '../../selectors/timesheet';
import CommonTimesheetService from '../../services/timesheet/common';
import DelegatedTimesheetService from '../../services/timesheet/delegated';
import DelegatedTimesheetConverter from '../../dto/timesheet/delegated';

function* sagaGetDelegatedTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate, action } = payload;
    const userName = yield select(selectUserName);
    const requestList = yield api.timesheetDelegated.getRequestListByAction({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userName,
      action
    });

    const userNames = CommonTimesheetService.getUserNameList(requestList.records);

    const peopleList = yield api.timesheetCommon.getInfoPeopleList({ userNames });

    const othCounts = yield api.timesheetDelegated.getTotalCountsByAction({ userName, action });
    const actionCounts = CommonTimesheetService.getTotalCounts(othCounts, { [action]: requestList.totalCount || 0 });

    const calendarEvents = yield api.timesheetCommon.getTimesheetCalendarEventsList({
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

    yield put(setDelegatedTimesheetByParams({ mergedList, actionCounts }));
  } catch (e) {
    logger.error('[timesheetDelegated sagaGetDelegatedTimesheetByParams saga] error', e.message);
  }
}

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTDelegatedUpdatingHours);
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
    logger.error('[timesheetDelegated sagaModifyStatus saga] error', e.message);
  }
}

function* sagaResetEventDayHours({ api, logger }, { payload }) {
  const updatingHoursState = yield select(selectTDelegatedUpdatingHours);

  try {
    const firstState = CommonTimesheetService.setUpdatingHours(updatingHoursState, payload, true);

    yield put(setUpdatingEventDayHours(firstState));
  } catch (e) {
    const secondState = CommonTimesheetService.setUpdatingHours(updatingHoursState, { ...payload, hasError: true });

    yield put(setUpdatingEventDayHours(secondState));
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetDelegated sagaResetEventDayHours saga] error', e.message);
  }
}

function* sagaModifyTaskStatus({ api, logger }, { payload }) {
  try {
    const currentUser = yield select(selectUserName);
    const { outcome, taskId, userName, comment } = payload;

    const mergedList = yield select(selectTDelegatedMergedList);

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
    logger.error('[timesheetDelegated sagaModifyTaskStatus saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDelegatedTimesheetByParams().type, sagaGetDelegatedTimesheetByParams, ea);
  yield takeLatest(modifyEventDayHours().type, sagaModifyEventDayHours, ea);
  yield takeLatest(resetEventDayHours().type, sagaResetEventDayHours, ea);
  yield takeLatest(modifyStatus().type, sagaModifyTaskStatus, ea);
}

export default saga;
