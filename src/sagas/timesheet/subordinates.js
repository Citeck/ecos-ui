import { put, takeLatest } from 'redux-saga/effects';
import {
  getSubordinatesEventsList,
  getSubordinatesList,
  setSubordinatesEventsList,
  setSubordinatesList
} from '../../actions/timesheet/subordinates';

function* sagaGetSubordinatesList({ api, logger }) {
  try {
    const res = yield api.timesheetSubordinates.getSubordinatesList();
    console.log(res);
    yield put(setSubordinatesList(res));
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesList saga error', e.message);
  }
}

function* sagaGetSubordinatesEventsList({ api, logger }) {
  try {
    const res = yield api.timesheetSubordinates.getSubordinatesEventsList();
    console.log(res);
    yield put(setSubordinatesEventsList(res));
  } catch (e) {
    logger.error('[pageTabs sagaGetSubordinatesEventsList saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getSubordinatesList().type, sagaGetSubordinatesList, ea);
  yield takeLatest(getSubordinatesEventsList().type, sagaGetSubordinatesEventsList, ea);
}

export default saga;
