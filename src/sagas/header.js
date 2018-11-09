import { put, takeLatest, call, select } from 'redux-saga/effects';
import {
  fetchCreateCaseWidgetData,
  setCreateCaseWidgetItems,
  setCreateCaseWidgetIsCascade,
  fetchUserMenuData,
  setUserMenuItems
} from '../actions/header';
import { processCreateVariantsItems, makeUserMenuItems } from '../helpers/menu';

function* fetchCreateCaseWidget({ api }) {
  try {
    const resp = yield call(api.menu.getCreateVariantsForAllSites);
    const createVariants = processCreateVariantsItems(resp);

    yield put(setCreateCaseWidgetItems(createVariants));

    // TODO get isCascade use api
    yield put(setCreateCaseWidgetIsCascade(true));
  } catch (e) {
    // TODO use logplease
    console.log('[fetchCreateCaseWidgetItemsRequest saga] ' + e.message);
    // yield put(validateUserFailure());
  }
}

const getUsername = state => state.user.fullName;
// TODO implement
function* fetchUserMenu({ api }) {
  try {
    const userName = select(getUsername);
    const menuItems = makeUserMenuItems(userName, true, true, false);
    yield put(setUserMenuItems(menuItems));
  } catch (e) {
    // TODO use logplease
    console.log('[fetchUserMenu saga] ' + e.message);
    // yield put(validateUserFailure());
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchCreateCaseWidgetData().type, fetchCreateCaseWidget, ea);
  yield takeLatest(fetchUserMenuData().type, fetchUserMenu, ea);
}

export default headerSaga;
