import { put, takeEvery, call } from 'redux-saga/effects';

import { getBirthdays, setBirthdays, setError } from '../actions/birthdays';
import { Labels } from '../components/widgets/Birthdays/Birthdays';
import { getBirthdayDateForWeb, sortByBirthDate } from '../dto/birthday';
import { getMonthPeriodByDate, t } from '../helpers/util';

function* sagaGetBirthdays({ api }, action) {
  try {
    const datePeriod = getMonthPeriodByDate();
    const result = yield call(api.birthdays.getBirthdays, datePeriod);
    const data = {
      totalCount: result.totalCount,
      birthdays: sortByBirthDate(result.records).map(getBirthdayDateForWeb)
    };

    yield put(setBirthdays({ stateId: action.payload, data }));
  } catch (e) {
    yield put(
      setError({
        stateId: action.payload,
        data: e.message || t(Labels.ERROR_DEFAULT_MESSAGE)
      })
    );
    console.error('[birthdays sagaGetBirthdays saga] error', e);
  }
}

function* appSaga(ea) {
  yield takeEvery(getBirthdays().type, sagaGetBirthdays, ea);
}

export default appSaga;
