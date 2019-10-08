import { put, select, takeLatest } from 'redux-saga/effects';
import {
  getCalendarEventList,
  getStatusList,
  getSubordinatesList,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart,
  modifyStatus,
  setMergedList,
  setStatusList
} from '../../actions/timesheet/subordinates';
import { setNotificationMessage } from '../../actions/notification';
import { selectTimesheetSubordinatesEvents, selectTimesheetSubordinatesPeople } from '../../selectors/timesheet';
import { selectUserUserName } from '../../selectors/user';
import SubordinatesTimesheetService from '../../services/timesheet/subordinates';
import SubordinatesTimesheetConverter from '../../dto/timesheet/subordinates';
import { TimesheetMessages } from '../../helpers/timesheet/constants';

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

function* sagaGetSubordinatesList({ api, logger }) {
  try {
    //const res = yield api.timesheetSubordinates.getSubordinatesList();
  } catch (e) {
    logger.error('[timesheetSubordinates sagaGetSubordinatesList saga error', e.message);
  }
}

function* sagaGetSubordinatesEventsList({ api, logger }) {
  try {
    //const res = yield api.timesheetSubordinates.getSubordinatesEventsList();
  } catch (e) {
    logger.error('[timesheetSubordinates sagaGetSubordinatesEventsList saga error', e.message);
  }
}

function* sagaGetStatusList({ api, logger }, { payload }) {
  try {
    const { currentDate } = payload;
    const subordinates = yield select(selectTimesheetSubordinatesPeople);
    const calendarEvents = yield select(selectTimesheetSubordinatesEvents);

    const userNames = SubordinatesTimesheetService.getUserNameList(subordinates);
    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames
    });

    const list = SubordinatesTimesheetService.mergeToSubordinatesEventsList({
      subordinates,
      calendarEvents,
      statuses: statuses.records
    });

    const mergedList = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);
    yield put(setMergedList(mergedList));
    yield put(setStatusList(statuses));
  } catch (e) {
    logger.error('[timesheetSubordinates sagaGetStatusList saga error', e.message);
  }
}

function* sagaModifyStatus({ api, logger }, { payload }) {
  try {
    const { outcome, taskId } = payload;

    yield api.timesheetCommon.modifyStatus({
      outcome,
      taskId
    });
  } catch (e) {
    yield put(setNotificationMessage(TimesheetMessages.ERROR_SAVE_STATUS));
    logger.error('[timesheetSubordinates sagaModifyStatus saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSubordinatesTimesheetStart().type, sagaInitSubordinatesTimesheet, ea);
  yield takeLatest(getSubordinatesList().type, sagaGetSubordinatesList, ea);
  yield takeLatest(getCalendarEventList().type, sagaGetSubordinatesEventsList, ea);
  yield takeLatest(getStatusList().type, sagaGetStatusList, ea);
  yield takeLatest(modifyStatus().type, sagaModifyStatus, ea);
}

export default saga;
