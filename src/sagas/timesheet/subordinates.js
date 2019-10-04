import { put, select, takeLatest } from 'redux-saga/effects';
import {
  getEventsList,
  getStatusList,
  getSubordinatesList,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart,
  setMergedList,
  setStatusList
} from '../../actions/timesheet/subordinates';
import { selectTimesheetSubordinatesEvents, selectTimesheetSubordinatesPeople } from '../../selectors/timesheet/subordinates';
import SubordinatesTimesheetService from '../../services/timesheet/subordinates';
import SubordinatesTimesheetConverter from '../../dto/timesheet/subordinates';

function* sagaInitSubordinatesTimesheet({ api, logger }) {
  try {
    const subordinates = yield api.timesheetSubordinates.getSubordinatesList();
    const userNames = SubordinatesTimesheetService.getUserNameList(subordinates.records);

    const currentDate = new Date();
    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames
    });

    const events = yield api.timesheetSubordinates.getSubordinatesEventsList();

    const list = SubordinatesTimesheetService.mergeToSubordinatesEventsList({
      subordinates: subordinates.records,
      events: events.records,
      statuses: statuses.records
    });

    const mergedList = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);

    yield put(initSubordinatesTimesheetEnd({ mergedList, userNames, subordinates, events, statuses }));
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesList saga error', e.message);
  }
}

function* sagaGetSubordinatesList({ api, logger }) {
  try {
    //const res = yield api.timesheetSubordinates.getSubordinatesList();
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesList saga error', e.message);
  }
}

function* sagaGetSubordinatesEventsList({ api, logger }) {
  try {
    //const res = yield api.timesheetSubordinates.getSubordinatesEventsList();
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesEventsList saga error', e.message);
  }
}

function* sagaGetStatusList({ api, logger }, { payload }) {
  try {
    const { currentDate } = payload;
    const subordinates = yield select(selectTimesheetSubordinatesPeople);
    const events = yield select(selectTimesheetSubordinatesEvents);

    const userNames = SubordinatesTimesheetService.getUserNameList(subordinates);
    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames
    });

    const list = SubordinatesTimesheetService.mergeToSubordinatesEventsList({
      subordinates,
      events,
      statuses: statuses.records
    });

    const mergedList = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);
    yield put(setMergedList(mergedList));
    yield put(setStatusList(statuses));
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesEventsList saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSubordinatesTimesheetStart().type, sagaInitSubordinatesTimesheet, ea);
  yield takeLatest(getSubordinatesList().type, sagaGetSubordinatesList, ea);
  yield takeLatest(getEventsList().type, sagaGetSubordinatesEventsList, ea);
  yield takeLatest(getStatusList().type, sagaGetStatusList, ea);
}

export default saga;
