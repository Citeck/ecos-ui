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
  updActiveSection,
  setAdminSectionInitStatus
} from '../actions/adminSection';
import PageService from '../services/PageService';
import AdminSectionService from '../services/AdminSectionService';
import { equalsQueryUrls } from '../helpers/urls';
import { wrapArgs } from '../helpers/redux';
import { getEnabledWorkspaces } from '../helpers/util';
import { SectionTypes } from '../constants/adminSection';

function* init({ logger }, action) {
  try {
    const { stateId } = action.payload || {};
    yield put(getIsAccessible(stateId));
    yield put(setAdminSectionInitStatus(true));
  } catch (e) {
    logger.error('[adminSection init saga] error', e);
  }
}

function* fetchIsAccessible({ api, logger }, { payload }) {
  try {
    const w = wrapArgs(payload);
    const isAccessible = yield call(api.devTools.getIsAccessiblePage);

    yield put(setIsAccessible(w(isAccessible)));
  } catch (e) {
    logger.error('[adminSection fetchIsAccessible saga] error', e);
  }
}

function* doFetchGroupSectionList({ api, logger }, action) {
  try {
    const { stateId } = action.payload || {};
    const w = wrapArgs(stateId);
    const sectionsGroup = yield call(api.adminSection.getGroupSectionList);
    const activeSection = AdminSectionService.getActiveSectionInGroups(sectionsGroup);

    yield put(setGroupSectionList(sectionsGroup));

    if (activeSection) {
      yield put(setActiveSection(w(activeSection)));
    }
  } catch (e) {
    logger.error('[adminSection doFetchGroupSectionList saga] error', e);
  }
}

function* updateActiveSection({ logger }, action) {
  try {
    const { stateId } = action.payload || {};
    const w = wrapArgs(stateId);
    const sectionsGroup = yield select(state => state.adminSection.groupSectionList || []);
    const activeSection = AdminSectionService.getActiveSectionInGroups(sectionsGroup);
    yield put(setActiveSection(w(activeSection)));
  } catch (e) {
    logger.error('[adminSection doFetchGroupSectionList saga] error', e);
  }
}

export function* openActiveSection({ api, logger }, action) {
  try {
    const item = cloneDeep(action.payload);
    const currentType = yield call(AdminSectionService.getActiveSectionType);
    const newType = get(item, 'type');
    const enabledWorkspaces = getEnabledWorkspaces();

    if (enabledWorkspaces && newType === SectionTypes.JOURNAL) {
      return;
    }

    const options = yield call(AdminSectionService.getTabOptions, currentType, newType);
    const href = yield call(AdminSectionService.getURLSection, item);
    const compareBy = ['activeTab', 'type', 'journalId'];

    if (enabledWorkspaces) {
      compareBy.push('ws');
    }

    const isSameLink = equalsQueryUrls({ urls: [href, window.location.href], compareBy });

    if (!isSameLink && href) {
      const contains = window.location.href.includes(href);

      yield call(PageService.changeUrlLink, contains ? window.location.href : href, options);
    }
  } catch (e) {
    logger.error('[adminSection openActiveSection saga] error', e);
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
