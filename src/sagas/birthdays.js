import { put, takeEvery, call } from 'redux-saga/effects';
import { getBirthdays } from '../actions/birthdays';

function* sagaGetBirthdays({ api, logger }, action) {
  try {
    const result = api.birthdays.getBirthdays();

    console.warn(result);
  } catch (e) {
    logger.error('[birthdays sagaGetBirthdays saga error', e.message);
  }
}

function* appSaga(ea) {
  yield takeEvery(getBirthdays().type, sagaGetBirthdays, ea);
}

export default appSaga;
