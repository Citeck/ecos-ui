import { call, put, takeEvery } from 'redux-saga/effects';
import { getFormList, setFormList } from '../actions/properties';

function* sagaGetFormList({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const response = yield call(api.properties.getFormList, { record });
    const { records: list, totalCount } = response;

    yield put(setFormList({ list, totalCount, stateId }));
  } catch (e) {
    logger.error('[properties/sagaGetFormList saga] error', e.message);
  }
}

function* propertiesSaga(ea) {
  yield takeEvery(getFormList().type, sagaGetFormList, ea);
}

export default propertiesSaga;
