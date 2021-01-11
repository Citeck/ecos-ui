import { call, put, takeEvery } from 'redux-saga/effects';
import { getTitle, setTitle } from '../actions/modelEditor';

function* fetchTitle({ api, logger }, { payload: { stateId, record } }) {
  try {
    const title = yield call(api.page.getRecordTitle, record);

    yield put(setTitle({ stateId, title }));
  } catch (e) {
    yield put(setTitle({ stateId, title: '' }));
    logger.error('[modelEditor/fetchTitle saga] error', e.message);
  }
}

function* modelEditorSaga(ea) {
  yield takeEvery(getTitle().type, fetchTitle, ea);
}

export default modelEditorSaga;
