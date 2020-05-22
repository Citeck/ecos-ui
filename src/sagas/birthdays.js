import { put, takeEvery } from 'redux-saga/effects';
import { getBirthdays, setBirthdays, setError } from '../actions/birthdays';
import { getBirthdayDateForWeb } from '../dto/birthday';
import { t } from '../helpers/util';
import { Labels } from '../components/widgets/Birthdays/Birthdays';

function* sagaGetBirthdays({ api, logger }, action) {
  try {
    const result = yield api.birthdays.getBirthdays();
    const data = {
      totalCount: result.totalCount,
      birthdays: result.records.map(getBirthdayDateForWeb)
    };

    yield put(setBirthdays({ stateId: action.payload, data }));
  } catch (e) {
    yield put(
      setError({
        stateId: action.payload,
        data: e.message || t(Labels.ERROR_DEFAULT_MESSAGE)
      })
    );
    logger.error('[birthdays sagaGetBirthdays saga error', e.message);
  }
}

function* appSaga(ea) {
  yield takeEvery(getBirthdays().type, sagaGetBirthdays, ea);
}

export default appSaga;
