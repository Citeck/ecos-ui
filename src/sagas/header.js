import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  fetchCreateCaseWidgetData,
  fetchSiteMenuData,
  fetchUserMenuData,
  goToPageFromSiteMenu,
  setCreateCaseWidgetIsCascade,
  setCreateCaseWidgetItems,
  setSiteMenuItems,
  setUserMenuItems
} from '../actions/header';
import { setUserThumbnail } from '../actions/user';
import { makeSiteMenu, makeUserMenuItems, processCreateVariantsItems } from '../helpers/menu';
import { PROXY_URI } from '../constants/alfresco';
import { selectIdentificationForView } from '../selectors/dashboard';
import { changeUrlLink } from '../components/PageTabs/PageTabs';

function* fetchCreateCaseWidget({ api, logger }) {
  try {
    const resp = yield call(api.menu.getCreateVariantsForAllSites);
    const createVariants = processCreateVariantsItems(resp);

    yield put(setCreateCaseWidgetItems(createVariants));

    const isCascadeMenu = yield call(api.app.getEcosConfig, 'default-ui-create-menu');
    yield put(setCreateCaseWidgetIsCascade(isCascadeMenu === 'cascad'));
  } catch (e) {
    logger.error('[fetchCreateCaseWidget saga] error', e.message);
  }
}

function* fetchUserMenu({ api, fakeApi, logger }) {
  try {
    const userName = yield select(state => state.user.userName);
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

function* fetchSiteMenu({ api, fakeApi, logger }) {
  try {
    const menuItems = makeSiteMenu();
    yield put(setSiteMenuItems(menuItems));
  } catch (e) {
    logger.error('[fetchSiteMenu saga] error', e.message);
  }
}

function* goToPageSiteMenu({ api, fakeApi, logger }, { payload }) {
  try {
    const data = yield select(selectIdentificationForView);
    let link = payload.targetUrl;

    if (payload.id === 'SETTINGS_HOME_PAGE') {
      link += '?dashboardId=' + data.id;
    }

    changeUrlLink(link, { openNewTab: true });
  } catch (e) {
    logger.error('[fetchSiteMenu saga] error', e.message);
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchCreateCaseWidgetData().type, fetchCreateCaseWidget, ea);
  yield takeLatest(fetchUserMenuData().type, fetchUserMenu, ea);
  yield takeLatest(fetchSiteMenuData().type, fetchSiteMenu, ea);
  yield takeLatest(goToPageFromSiteMenu().type, goToPageSiteMenu, ea);
}

export default headerSaga;
