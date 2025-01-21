import { setHtml, setLoading, updateHtmlWidget } from '../actions/customWidgetHtml';
import { takeEvery } from 'redux-saga';
import { put } from 'redux-saga/effects';
import { wrapArgs } from '../helpers/redux';

function* sagaUpdateHtmlWidget({ api, logger }, { payload }) {
  try {
    const { html, stateId } = payload;
    const w = wrapArgs(stateId);
    yield put(setLoading(w(true)));

    yield put(setHtml(w(html)));

    yield put(setLoading(w(false)));
  } catch (e) {
    logger.error('[publications/sagaUpdateHtmlWidget saga] error', e);
  }
}

function* customWidgetHtmlSaga(ea) {
  yield takeEvery(updateHtmlWidget().type, sagaUpdateHtmlWidget, ea);
}

export default customWidgetHtmlSaga;
