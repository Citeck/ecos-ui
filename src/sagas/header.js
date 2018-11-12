import { put, takeLatest, call, select } from 'redux-saga/effects';
import {
  fetchCreateCaseWidgetData,
  setCreateCaseWidgetItems,
  setCreateCaseWidgetIsCascade,
  fetchUserMenuData,
  setUserMenuItems
} from '../actions/header';
import { setUserThumbnail } from '../actions/user';
import { processCreateVariantsItems, makeUserMenuItems } from '../helpers/menu';
import { PROXY_URI } from '../constants/alfresco';

function* fetchCreateCaseWidget({ api, fakeApi, logger }) {
  try {
    const resp = yield call(api.menu.getCreateVariantsForAllSites);
    const createVariants = processCreateVariantsItems(resp);

    yield put(setCreateCaseWidgetItems(createVariants));

    // TODO use real api
    const isCascadeMenu = yield call(fakeApi.getIsCascadeCreateVariantMenu);
    yield put(setCreateCaseWidgetIsCascade(isCascadeMenu));
  } catch (e) {
    logger.error('[fetchCreateCaseWidget saga] error', e.message);
  }
}

function* fetchUserMenu({ api, fakeApi, logger }) {
  try {
    const userName = yield select(state => state.user.fullName);
    const isAvailable = yield select(state => state.user.isAvailable);
    const isMutable = yield select(state => state.user.isMutable);

    // TODO use real api
    const isExternalAuthentication = yield call(fakeApi.getIsExternalAuthentication);

    const menuItems = makeUserMenuItems(userName, isAvailable, isMutable, isExternalAuthentication);
    yield put(setUserMenuItems(menuItems));

    const userNodeRef = yield select(state => state.user.nodeRef);
    if (userNodeRef) {
      const userPhotoSize = yield call(api.user.getPhotoSize, userNodeRef);
      if (userPhotoSize > 0) {
        const photoUrl = PROXY_URI + `citeck/ecos/image/thumbnail?nodeRef=${userNodeRef}&property=ecos:photo&width=150`;
        yield put(setUserThumbnail(photoUrl));
      }
    }
  } catch (e) {
    logger.error('[fetchUserMenu saga] error', e.message);
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchCreateCaseWidgetData().type, fetchCreateCaseWidget, ea);
  yield takeLatest(fetchUserMenuData().type, fetchUserMenu, ea);
}

export default headerSaga;
