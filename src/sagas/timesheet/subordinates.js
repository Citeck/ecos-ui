import { put, takeLatest } from 'redux-saga/effects';
import {
  getEventsList,
  getSubordinatesList,
  initSubordinatesTimesheetEnd,
  initSubordinatesTimesheetStart
} from '../../actions/timesheet/subordinates';
import SubordinatesTimesheetService from '../../services/timesheet/subordinates';
import SubordinatesTimesheetConverter from '../../dto/timesheet/subordinates';

function* sagaInitSubordinatesTimesheet({ api, logger }) {
  try {
    const subordinates = yield api.timesheetSubordinates.getSubordinatesList();
    const events = yield api.timesheetSubordinates.getSubordinatesEventsList();
    const list = SubordinatesTimesheetService.mergeToSubordinatesEventsList({
      subordinates: subordinates.records,
      events: events.records
    });
    const records = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);

    yield put(initSubordinatesTimesheetEnd({ records }));
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesList saga error', e.message);
  }
}

function* sagaGetSubordinatesList({ api, logger }) {
  try {
    const res = yield api.timesheetSubordinates.getSubordinatesList();
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesList saga error', e.message);
  }
}

function* sagaGetSubordinatesEventsList({ api, logger }) {
  try {
    const res = yield api.timesheetSubordinates.getSubordinatesEventsList();
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesEventsList saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSubordinatesTimesheetStart().type, sagaInitSubordinatesTimesheet, ea);
  yield takeLatest(getSubordinatesList().type, sagaGetSubordinatesList, ea);
  yield takeLatest(getEventsList().type, sagaGetSubordinatesEventsList, ea);
}

export default saga;
