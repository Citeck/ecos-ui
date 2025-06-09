import { put, takeEvery } from 'redux-saga/effects';

import { setHtml, setLoading, updateHtmlWidget } from '@/actions/customWidgetHtml';
import { wrapArgs } from '@/helpers/redux';
import { ExtraArgumentsStore } from '@/types/store';

function* sagaUpdateHtmlWidget(_: ExtraArgumentsStore, { payload }: ReturnType<typeof updateHtmlWidget>) {
  try {
    const { html, stateId } = payload;
    const w = wrapArgs(stateId);
    yield put(setLoading(w(true)));
    yield put(setHtml(w(html)));
  } catch (e) {
    console.error('[publications/sagaUpdateHtmlWidget saga] error', e);
  }
}

function* customWidgetHtmlSaga(ea: ExtraArgumentsStore) {
  yield takeEvery(updateHtmlWidget.toString(), sagaUpdateHtmlWidget, ea);
}

export default customWidgetHtmlSaga;
