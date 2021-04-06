import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import {
  fetchGroupSectionList,
  getIsAccessible,
  initAdminSection,
  setActiveSection,
  setGroupSectionList,
  setIsAccessible,
  updActiveSection
} from '../actions/adminSection';
import PageService from '../services/PageService';
import AdminSectionService from '../services/AdminSectionService';
import { equalsQueryUrls } from '../helpers/urls';

function* init({ api, logger }, action) {
  try {
    yield put(getIsAccessible());
  } catch (e) {
    logger.error('[adminSection init saga] error', e.message);
  }
}

function* fetchIsAccessible({ api, logger }, action) {
  try {
    const isAccessible = yield call(api.devTools.getIsAccessiblePage);

    yield put(setIsAccessible(isAccessible));
  } catch (e) {
    logger.error('[adminSection fetchIsAccessible saga] error', e.message);
  }
}

function* doFetchGroupSectionList({ api, logger }, action) {
  try {
    const sectionsGroup = yield call(api.adminSection.getGroupSectionList);
    const activeSection = AdminSectionService.getActiveSectionInGroups(sectionsGroup);

    yield put(setGroupSectionList(sectionsGroup));
    yield put(setActiveSection(activeSection));
  } catch (e) {
    logger.error('[adminSection doFetchGroupSectionList saga] error', e.message);
  }
}

function* updateActiveSection({ api, logger }, action) {
  try {
    const sectionsGroup = yield select(state => state.adminSection.groupSectionList || []);
    const activeSection = AdminSectionService.getActiveSectionInGroups(sectionsGroup);

    yield put(setActiveSection(activeSection));
  } catch (e) {
    logger.error('[adminSection doFetchGroupSectionList saga] error', e.message);
  }
}

export function* openActiveSection({ api, logger }, action) {
  try {
    const item = cloneDeep(action.payload);
    const currentType = yield call(AdminSectionService.getActiveSectionType);
    const newType = get(item, 'type');
    const options = yield call(AdminSectionService.getTabOptions, currentType, newType);
    const href = yield call(AdminSectionService.getURLSection, item);
    const isSameLink = equalsQueryUrls({ urls: [href, window.location.href], compareBy: ['type', 'journalId'] });

    if (!isSameLink && href) {
      yield call(PageService.changeUrlLink, href, options);
    }
  } catch (e) {
    logger.error('[adminSection openActiveSection saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initAdminSection().type, init, ea);
  yield takeLatest(getIsAccessible().type, fetchIsAccessible, ea);
  yield takeLatest(fetchGroupSectionList().type, doFetchGroupSectionList, ea);
  yield takeEvery(setActiveSection().type, openActiveSection, ea);
  yield takeEvery(updActiveSection().type, updateActiveSection, ea);
}

export default saga;
