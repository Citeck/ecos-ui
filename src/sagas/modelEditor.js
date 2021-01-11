import { put, takeEvery } from 'redux-saga/effects';
import { getTitle, setTitle } from '../actions/modelEditor';

function* fetchTitle({ api, logger }, { payload: { stateId } }) {
  try {
    yield put(setTitle({ stateId, title: '5555555555555555' }));
  } catch (e) {
    yield put(setTitle({ stateId, title: '' }));
    logger.error('[modelEditor/fetchTitle saga] error', e.message);
  }
}

function* barcodeSaga(ea) {
  yield takeEvery(getTitle().type, fetchTitle, ea);
}

export default barcodeSaga;
