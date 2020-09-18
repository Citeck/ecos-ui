import { call, put, select, takeLatest } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  fetchLargeLogoSrc,
  fetchSlideMenuItems,
  fetchSmallLogoSrc,
  getSiteDashboardEnable,
  setInitExpandableItems,
  setIsReady,
  setLargeLogo,
  setSelectedId,
  setSiteDashboardEnable,
  setSlideMenuItems,
  setSmallLogo,
  toggleIsOpen
} from '../actions/slideMenu';
import SidebarService from '../services/sidebar';
import SidebarConverter from '../dto/sidebar';

function* fetchSmallLogo({ api, fakeApi, logger }) {
  try {
    const themeName = yield select(state => state.view.theme);
    const logoSrc = yield call(fakeApi.getSmallLogoSrc, themeName);
    yield put(setSmallLogo(logoSrc));
  } catch (e) {
    logger.error('[fetchSmallLogo saga] error', e.message);
  }
}

function* fetchLargeLogo({ api, fakeApi, logger }) {
  try {
    const themeName = yield select(state => state.view.theme);
    const logoSrc = yield call(fakeApi.getLargeLogoSrc, themeName);
    yield put(setLargeLogo(logoSrc));
  } catch (e) {
    logger.error('[fetchLargeLogo saga] error', e.message);
  }
}

function* fetchSlideMenu({ api, fakeApi, logger }, action) {
  try {
    const version = yield select(state => state.menu.version);
    const selectedId = SidebarService.getSelected();
    const isOpen = SidebarService.getOpenState();
    const id = get(action, 'payload.id');

    let menuItems;

    if (id || version) {
      menuItems = yield call(api.menu.getMenuItems, { id, version });
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
  yield takeLatest(fetchSmallLogoSrc().type, fetchSmallLogo, ea);
  yield takeLatest(fetchLargeLogoSrc().type, fetchLargeLogo, ea);
  yield takeLatest(fetchSlideMenuItems().type, fetchSlideMenu, ea);
  yield takeLatest(getSiteDashboardEnable().type, fetchSiteDashboardEnable, ea);
  yield takeLatest(toggleIsOpen().type, fetchToggleMenu, ea);
  yield takeLatest(setSelectedId().type, fetchSelectedId, ea);
}

export default headerSaga;
