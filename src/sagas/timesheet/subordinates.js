import { put, select, takeLatest } from 'redux-saga/effects';
import { TimesheetMessages } from '../../helpers/timesheet/constants';
import {
  getSubordinatesTimesheetByParams,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart,
  modifyEventDayHours,
  modifyStatus,
  setLoading,
  setMergedList,
  setPopupMessage,
  setStatusList,
  setSubordinatesTimesheetByParams
} from '../../actions/timesheet/subordinates';
import {
  selectTimesheetSubordinatesMergedList,
  selectTimesheetSubordinatesPeople,
  selectTimesheetSubordinatesStatuses
} from '../../selectors/timesheet';
import { selectUserUserName } from '../../selectors/user';
import SubordinatesTimesheetService from '../../services/timesheet/subordinates';
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
    logger.error('[timesheetSubordinates sagaInitSubordinatesTimesheet saga error', e.message);
  }
}

// function* sagaGetStatusList({ api, logger }, { payload }) {
//   try {
//     const { currentDate } = payload;
//     const subordinates = yield select(selectTimesheetSubordinatesPeople);
//     const calendarEvents = yield select(selectTimesheetSubordinatesEvents);
//
//     const userNames = SubordinatesTimesheetService.getUserNameList(subordinates);
//     const statuses = yield api.timesheetCommon.getTimesheetStatusList({
//       month: currentDate.getMonth(),
//       year: currentDate.getFullYear(),
//       userNames
//     });
//
//     const list = SubordinatesTimesheetService.mergeToSubordinatesEventsList({
//       subordinates,
//       calendarEvents,
//       statuses: statuses.records
//     });
//
//     const mergedList = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);
//     yield put(setMergedList(mergedList));
//     yield put(setStatusList(statuses));
//   } catch (e) {
//     logger.error('[timesheetSubordinates sagaGetStatusList saga error', e.message);
//   }
// }

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
    logger.error('[timesheetSubordinates sagaGetSubordinatesTimesheetByParams saga error', e.message);
  }
}

function* sagaModifyTaskStatus({ api, logger }, { payload }) {
  try {
    const { outcome, taskId, userName, currentDate } = payload;

    const mergedList = yield select(selectTimesheetSubordinatesMergedList);
    const statuses = yield select(selectTimesheetSubordinatesStatuses);

    yield api.timesheetCommon.modifyStatus({
      outcome,
      taskId
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
    logger.error('[timesheetSubordinates sagaModifyTaskStatus saga error', e.message);
  }
}

function* sagaModifyEventDayHours({ api, logger }, { payload }) {
  try {
    const { value, date, eventType, userName } = payload;

    yield api.timesheetCommon.modifyEventHours({ userName, date, eventType, value });
  } catch (e) {
    yield put(setPopupMessage(e.message || TimesheetMessages.ERROR_SAVE_EVENT_HOURS));
    logger.error('[timesheetMine sagaModifyStatus saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSubordinatesTimesheetStart().type, sagaInitSubordinatesTimesheet, ea);
  yield takeLatest(getSubordinatesTimesheetByParams().type, sagaGetSubordinatesTimesheetByParams, ea);
  yield takeLatest(modifyStatus().type, sagaModifyTaskStatus, ea);
  yield takeLatest(modifyEventDayHours().type, sagaModifyEventDayHours, ea);
}

export default saga;
