import { put, takeEvery, call } from 'redux-saga/effects';
import { getBirthdays, setBirthdays } from '../actions/birthdays';
import { getBirthdayDateForWeb } from '../dto/birthday';

function* sagaGetBirthdays({ api, logger }, action) {
  try {
    const result = yield api.birthdays.getBirthdays();
    const data = result.records.map(getBirthdayDateForWeb);

    yield put(setBirthdays({ stateId: action.payload, data }));
  } catch (e) {
    logger.error('[birthdays sagaGetBirthdays saga error', e.message);
  }
}

function* appSaga(ea) {
  yield takeEvery(getBirthdays().type, sagaGetBirthdays, ea);
}

export default appSaga;
