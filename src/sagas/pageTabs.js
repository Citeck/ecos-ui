import { put, takeLatest, call } from 'redux-saga/effects';
import { getShowTabsStatus, setShowTabsStatus, getTabs, setTabs } from '../actions/pageTabs';
import * as ls from '../helpers/ls';

const lsKey = ls.generateKey('page-tabs', true);

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
        false
      );
    }, action.payload);

    yield put(setShowTabsStatus(result));
  } catch (e) {
    logger.error('[pageTabs sagaGetShowTabsStatus saga error', e.message);
  }
}

function* sagaGetTabs({ api, logger }) {
  try {
    const hasData = yield ls.hasData(lsKey, 'array');
    let tabs = [];

    if (hasData) {
      tabs = yield ls.getData(lsKey);
    }

    yield put(setTabs(tabs));
  } catch (e) {
    logger.error('[pageTabs sagaGetTabs saga error', e.message);
  }
}

function* sagaSetTabs({ api, logger }, action) {
  try {
    yield ls.setData(lsKey, action.payload);
  } catch (e) {
    logger.error('[pageTabs sagaSetTabs saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getShowTabsStatus().type, sagaGetShowTabsStatus, ea);
  yield takeLatest(getTabs().type, sagaGetTabs, ea);
  yield takeLatest(setTabs().type, sagaSetTabs, ea);
}

export default saga;
