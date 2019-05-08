import { put, takeLatest, call } from 'redux-saga/effects';
import { getShowTabsStatus, setShowTabsStatus } from '../actions/pageTabs';

function* sagaGetShowTabsStatus({ api, logger }, action) {
  try {
    const result = yield call(function() {
      return window.Citeck.Records.queryOne(
        {
          query: {
            key: 'tabs-enabled'
          },
          sourceId: 'uiserv/config'
        },
        '.bool',
        true
      );
    }, action.payload);

    yield put(setShowTabsStatus(result));
  } catch (e) {
    logger.error(e);
  }
}

function* saga(ea) {
  yield takeLatest(getShowTabsStatus().type, sagaGetShowTabsStatus, ea);
}

export default saga;
