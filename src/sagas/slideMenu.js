import { put, takeLatest, call } from 'redux-saga/effects';
import {
  fetchSmallLogoSrc,
  fetchLargeLogoSrc,
  fetchSlideMenuItems,
  setSmallLogo,
  setLargeLogo,
  setSlideMenuItems,
  setSlideMenuExpandableItems,
  setSelectedId
} from '../actions/slideMenu';
import { selectedMenuItemIdKey, processApiData, fetchExpandableItems } from '../helpers/slideMenu';

function* fetchSmallLogo({ api, fakeApi, logger }) {
  try {
    const logoSrc = yield call(fakeApi.getSmallLogoSrc);
    yield put(setSmallLogo(logoSrc));
  } catch (e) {
    logger.error('[fetchSmallLogo saga] error', e.message);
  }
}

function* fetchLargeLogo({ api, fakeApi, logger }) {
  try {
    const logoSrc = yield call(fakeApi.getLargeLogoSrc);
    yield put(setLargeLogo(logoSrc));
  } catch (e) {
    logger.error('[fetchLargeLogo saga] error', e.message);
  }
}

function* fetchSlideMenu({ api, fakeApi, logger }) {
  try {
    const apiData = yield call(fakeApi.getSlideMenuItems);
    const menuItems = processApiData(apiData);

    let selectedId = null;
    if (sessionStorage && sessionStorage.getItem) {
      selectedId = sessionStorage.getItem(selectedMenuItemIdKey);
      yield put(setSelectedId(selectedId));
    }

    const expandableItems = fetchExpandableItems(menuItems, selectedId);

    yield put(setSlideMenuItems(menuItems));
    yield put(setSlideMenuExpandableItems(expandableItems));
  } catch (e) {
    logger.error('[fetchSlideMenu saga] error', e.message);
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchSmallLogoSrc().type, fetchSmallLogo, ea);
  yield takeLatest(fetchLargeLogoSrc().type, fetchLargeLogo, ea);
  yield takeLatest(fetchSlideMenuItems().type, fetchSlideMenu, ea);
}

export default headerSaga;
