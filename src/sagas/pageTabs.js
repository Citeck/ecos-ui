import { call, put, select, takeLatest } from 'redux-saga/effects';
import { getShowTabsStatus, getTabs, setActiveTabTitle, setShowTabsStatus, setTabs } from '../actions/pageTabs';
import { selectTabs } from '../selectors/pageTabs';
import { deepClone, getCurrentUserName } from '../helpers/util';
import Records from '../components/Records';
import { isNewVersionPage } from '../helpers/urls';

function* sagaGetShowTabsStatus({ api, logger }, action) {
  try {
    const result = yield call(function() {
      if (!isNewVersionPage()) {
        return Promise.resolve(false);
      }

      return Records.get('uiserv/config@tabs-enabled')
        .load('value?bool')
        .then(value => {
          return value != null ? value : true;
        })
        .catch(e => {
          logger.error('[pageTabs sagaGetShowTabsStatus saga error', e);
          return false;
        });
    }, action.payload);

    yield put(setShowTabsStatus(result));
  } catch (e) {
    logger.error('[pageTabs sagaGetShowTabsStatus saga error', e.message);
  }
}

function* sagaGetTabs({ api, logger }) {
  try {
    const userName = getCurrentUserName();

    yield api.pageTabs.checkOldVersion(userName);
    const tabs = yield api.pageTabs.getAll();

    yield put(setTabs(tabs));
  } catch (e) {
    logger.error('[pageTabs sagaGetTabs saga error', e.message);
  }
}

function* sagaSetTabs({ api, logger }, action) {
  try {
    yield api.pageTabs.set(action.payload);
  } catch (e) {
    logger.error('[pageTabs sagaSetTabs saga error', e.message);
  }
}

function* sagaSetActiveTabTitle({ api, logger }, action) {
  try {
    const tabs = deepClone(yield select(selectTabs));
    const activeIndex = tabs.findIndex(tab => tab.isActive);

    if (activeIndex !== -1) {
      tabs[activeIndex].title = action.payload;
    }

    yield put(setTabs(tabs));
  } catch (e) {
    logger.error('[pageTabs sagaSetActiveTabTitle saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getShowTabsStatus().type, sagaGetShowTabsStatus, ea);
  yield takeLatest(getTabs().type, sagaGetTabs, ea);
  yield takeLatest(setTabs().type, sagaSetTabs, ea);
  yield takeLatest(setActiveTabTitle().type, sagaSetActiveTabTitle, ea);
}

export default saga;
