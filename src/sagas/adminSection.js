import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';

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
import { SectionTypes } from '../constants/adminSection';
import { wrapArgs } from '../helpers/redux';
import { equalsQueryUrls } from '../helpers/urls';
import { getEnabledWorkspaces } from '../helpers/util';
import AdminSectionService from '../services/AdminSectionService';
import PageService from '../services/PageService';

function* init({}, action) {
  try {
    const stateId = action.payload;
    const w = wrapArgs(stateId);

    yield put(getIsAccessible(stateId));
    yield put(setAdminSectionInitStatus(w(true)));
  } catch (e) {
    console.error('[adminSection init saga] error', e);
  }
}

function* fetchIsAccessible({ api }, { payload }) {
  try {
    const w = wrapArgs(payload);
    const isAccessible = yield call(api.devTools.getIsAccessiblePage);

    yield put(setIsAccessible(w(isAccessible)));
  } catch (e) {
    console.error('[adminSection fetchIsAccessible saga] error', e);
  }
}

function* doFetchGroupSectionList({ api }, action) {
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
    console.error('[adminSection doFetchGroupSectionList saga] error', e);
  }
}

function* updateActiveSection({ api }, action) {
  try {
    const stateId = action.payload;
    const w = wrapArgs(stateId);
    let sectionsGroup = yield select(state => state.adminSection.groupSectionList || []);
    if (!sectionsGroup || !sectionsGroup.length) {
      sectionsGroup = yield call(api.adminSection.getGroupSectionList);
    }
    const activeSection = AdminSectionService.getActiveSectionInGroups(sectionsGroup);
    yield put(setActiveSection(w(activeSection)));
  } catch (e) {
    console.error('[adminSection doFetchGroupSectionList saga] error', e);
  }
}

export function* openActiveSection({ api }, action) {
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
    console.error('[adminSection openActiveSection saga] error', e);
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
