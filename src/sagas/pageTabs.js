import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { push } from 'connected-react-router';
import queryString from 'query-string';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import find from 'lodash/find';

import {
  addTab,
  changeTab,
  deleteTab,
  getTabs,
  initTabs,
  initTabsComplete,
  moveTabs,
  setDisplayState,
  setShowTabsStatus,
  setTabs
} from '../actions/pageTabs';
import { selectInitStatus } from '../selectors/pageTabs';
import { selectIsAuthenticated } from '../selectors/user';
import { getCurrentUserName, t } from '../helpers/util';
import { URL } from '../constants';
import { TITLE } from '../constants/pageTabs';
import PageTabList from '../services/pageTabs/PageTabListService';
import { PageTypes } from '../services/pageTabs/PageTab';

function* sagaInitTabs({ api, logger }) {
  try {
    const location = yield select(state => state.router.location);
    const activeUrl = location.pathname + location.search;
    const isAuthorized = yield select(selectIsAuthenticated);
    const needShowTabs = yield call(api.pageTabs.getShowStatus);
    const userName = yield call(getCurrentUserName);

    yield put(setShowTabsStatus(needShowTabs));

    if (!isAuthorized || !needShowTabs) {
      return;
    }

    yield call(api.pageTabs.checkOldVersion, userName);

    PageTabList.init({ activeUrl, keyStorage: api.pageTabs.lsKey });

    yield put(setTabs(PageTabList.storeList));
    yield put(initTabsComplete());

    const tabs = yield PageTabList.tabs.map(function*(tab) {
      const data = yield* getTabWithTitle({ api, logger }, { payload: tab });

      return {
        ...tab,
        ...data
      };
    });

    PageTabList.updateAll({ tabs });
    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaInitTabs saga error', e.message);
  }
}

function* sagaGetTabs({ api, logger }, action) {
  try {
    const inited = yield select(selectInitStatus);
    const isAuthorized = yield select(selectIsAuthenticated);
    const { force } = action.payload || {};

    if (!inited || !isAuthorized) {
      return;
    }

    if (!!PageTabList.tabs.length && !force) {
      return PageTabList.tabs;
    }

    yield put(initTabs());
  } catch (e) {
    logger.error('[pageTabs sagaGetTabs saga error', e.message);
  }
}

function* sagaSetDisplayState({ api, logger }, { payload }) {
  try {
    PageTabList.displayState = payload;
  } catch (e) {
    logger.error('[pageTabs sagaSetDisplayState saga error', e.message);
  }
}

function* sagaMoveTabs({ api, logger }, action) {
  try {
    const { indexFrom, indexTo } = action.payload;

    PageTabList.move(indexFrom, indexTo);
    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaMoveTabs saga error', e.message);
  }
}

function* sagaAddTab({ api, logger }, { payload }) {
  try {
    const { event, linkIgnoreAttr, ...params } = payload.params;
    const initData = payload.data || PageTabList.definePropsLink({ event, linkIgnoreAttr });

    if (!initData) {
      return;
    }

    const tab = PageTabList.setTab(initData, params);

    if (tab.isActive && tab.link) {
      yield put(push(tab.link));
    }

    yield put(setTabs(PageTabList.storeList));

    const data = yield* getTabWithTitle({ api, logger }, { payload: tab });

    yield put(changeTab({ data, tab }));
  } catch (e) {
    logger.error('[pageTabs sagaAddTab saga error', e.message);
  }
}

function* sagaDeleteTab({ api, logger }, action) {
  try {
    PageTabList.delete(action.payload);

    const activeTab = PageTabList.activeTab;

    if (activeTab && activeTab.link) {
      yield put(push(activeTab.link));
    }

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaDeleteTab saga error', e.message);
  }
}

function* getTabWithTitle({ api, logger }, action) {
  try {
    const data = action.payload;
    const urlProps = queryString.parseUrl(data.link);

    let msDelay = 80;
    let title = '';

    if (!isEmpty(urlProps.query)) {
      const { recordRef, nodeRef, journalId, dashboardId } = urlProps.query;
      const record = recordRef || nodeRef;

      if (record || journalId) {
        msDelay = 0;
      }

      if (record) {
        const response = yield call(api.pageTabs.getTabTitle, { recordRef: record });

        title = get(response, 'displayName', t(TITLE.NEW_TAB));
      }

      if (journalId) {
        const journalTitle = yield call(api.pageTabs.getTabTitle, { journalId });

        if (journalTitle) {
          title = `${t('journal.title')} "${journalTitle}"`;
        }
      }

      if (dashboardId && !record && !journalId) {
        title = t(TITLE.HOMEPAGE);
      }
    } else {
      switch (data.type) {
        case PageTypes.DASHBOARD: {
          title = t(TITLE.HOMEPAGE);
          break;
        }
        case PageTypes.BPMN_DESIGNER: {
          title = t(TITLE[URL.BPMN_DESIGNER]);
          break;
        }
        case PageTypes.TIMESHEET: {
          title = t(TITLE.TIMESHEET);
          break;
        }
        default: {
          title = t(get(TITLE, data.link, TITLE.NO_NAME));
        }
      }
    }

    if (data.type === PageTypes.SETTINGS) {
      title = t(TITLE[URL.DASHBOARD_SETTINGS]) + ' - ' + title;
    }

    yield delay(msDelay);

    return {
      title,
      isLoading: false
    };
  } catch (e) {
    console.error(e);
    throw new Error('[pageTabs getTabWithTitle function error');
  }
}

function* sagaChangeTabData({ api, logger }, { payload }) {
  try {
    const inited = yield select(selectInitStatus);

    if (!inited) {
      return;
    }

    const { filter, data: updates } = payload;
    const tab = payload.tab || find(PageTabList.tabs, filter);

    PageTabList.changeOne({ tab, updates });

    if (updates.isActive) {
      yield put(push(tab.link));
    }

    yield put(setTabs(PageTabList.storeList));
  } catch (e) {
    logger.error('[pageTabs sagaChangeTabData saga error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initTabs().type, sagaInitTabs, ea);
  yield takeLatest(getTabs().type, sagaGetTabs, ea);
  yield takeEvery(setDisplayState().type, sagaSetDisplayState, ea);
  yield takeEvery(moveTabs().type, sagaMoveTabs, ea);
  yield takeEvery(addTab().type, sagaAddTab, ea);
  yield takeEvery(deleteTab().type, sagaDeleteTab, ea);
  yield takeEvery(changeTab().type, sagaChangeTabData, ea);
}

export default saga;
