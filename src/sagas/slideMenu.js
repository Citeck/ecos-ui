import { call, put, select, takeLatest } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  fetchSlideMenuItems,
  getSiteDashboardEnable,
  setInitExpandableItems,
  setIsReady,
  setSelectedId,
  setSiteDashboardEnable,
  setSlideMenuItems,
  toggleIsOpen
} from '../actions/slideMenu';
import SidebarService from '../services/sidebar';
import SidebarConverter from '../dto/sidebar';

function* fetchSlideMenu({ api, logger }, action) {
  try {
    const version = yield select(state => state.menu.version);
    const selectedId = SidebarService.getSelected();
    const isOpen = SidebarService.getOpenState();
    const id = get(action, 'payload.id');

    let menuItems;

    if (id || version) {
      menuItems = yield call(api.menu.getMenuItems, { id, version, resolved: true });
    } else {
      const apiData = yield call(api.menu.getSlideMenuItems);
      menuItems = apiData.items;
    }

    menuItems = SidebarConverter.getMenuListWeb(menuItems);

    yield put(toggleIsOpen(isOpen));
    yield put(setSelectedId(selectedId));
    yield put(setSlideMenuItems(menuItems));
    yield put(setInitExpandableItems());
    yield put(setIsReady(true));
  } catch (e) {
    logger.error('[fetchSlideMenu saga] error', e.message);
  }
}

function* fetchSiteDashboardEnable({ api, logger }) {
  try {
    const res = yield call(api.menu.checkSiteDashboardEnable);

    yield put(setSiteDashboardEnable(!!res));
  } catch (e) {
    logger.error('[fetchSiteDashboardEnable saga] error', e.message);
  }
}

function fetchToggleMenu({ api, logger }, action) {
  try {
    SidebarService.setOpenState(action.payload);
  } catch (e) {
    logger.error('[fetchToggleMenu saga] error', e.message);
  }
}

function fetchSelectedId({ api, logger }, action) {
  try {
    SidebarService.setSelected(action.payload);
  } catch (e) {
    logger.error('[fetchToggleMenu saga] error', e.message);
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchSlideMenuItems().type, fetchSlideMenu, ea);
  yield takeLatest(getSiteDashboardEnable().type, fetchSiteDashboardEnable, ea);
  yield takeLatest(toggleIsOpen().type, fetchToggleMenu, ea);
  yield takeLatest(setSelectedId().type, fetchSelectedId, ea);
}

export default headerSaga;
