import isEmpty from 'lodash/isEmpty';

import { initPreviewList, setIsEnabledPreviewList, setLoadingPreviewList, setPreviewListConfig } from '../actions/previewList';
import { takeLatest, put, select, call } from 'redux-saga/effects';
import { wrapArgs } from '../helpers/redux';
import { selectUrl } from '../selectors/journals';

function* sagaInitPreviewList({ api, logger }, action) {
  const { stateId } = action.payload || {};
  const w = wrapArgs(stateId);

  try {
    yield put(setLoadingPreviewList(w(true)));

    const journalUrlParams = yield select(selectUrl, stateId);
    const { journalId } = journalUrlParams || {};

    const journalTypeRef = yield call(api.journals.getJournalTypeRef, journalId);
    const previewListConfig = yield call(api.previewList.getPreviewListConfig, journalTypeRef);

    if (previewListConfig && !isEmpty(previewListConfig)) {
      yield put(setIsEnabledPreviewList(w(true)));
      yield put(setPreviewListConfig(w(previewListConfig)));
    }

    yield put(setLoadingPreviewList(w(false)));
  } catch (e) {
    yield put(setLoadingPreviewList(w(false)));
    logger.error('[previewList/sagaInitPreviewList saga] error', e);
  }
}

function* saga(ea) {
  yield takeLatest(initPreviewList().type, sagaInitPreviewList, ea);
}

export default saga;
