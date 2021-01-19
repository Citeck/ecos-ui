import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import queryString from 'query-string';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { URL } from '../constants';
import { SectionTypes, SectionURL } from '../constants/adminSection';
import PageService from '../services/PageService';
import AdminSectionService from '../services/AdminSectionService';
import { fetchGroupSectionList, setActiveSection, setGroupSectionList, updActiveSection } from '../actions/adminSection';

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
    let href = '';

    switch (newType) {
      case SectionTypes.BPM: {
        href = SectionURL[SectionTypes.BPM];
        break;
      }
      case SectionTypes.JOURNAL: {
        href = queryString.stringifyUrl({ url: URL.BPMN_DESIGNER, query: { journalId: get(item, 'config.journalId') } });
        break;
      }
      case SectionTypes.DEV_TOOLS: {
        href = SectionURL[SectionTypes.DEV_TOOLS];
        break;
      }
      default: {
        console.warn('Unknown section');
        return;
      }
    }

    yield call(PageService.changeUrlLink, href, options);
  } catch (e) {
    logger.error('[adminSection openActiveSection saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(fetchGroupSectionList().type, doFetchGroupSectionList, ea);
  yield takeEvery(setActiveSection().type, openActiveSection, ea);
  yield takeEvery(updActiveSection().type, updateActiveSection, ea);
}

export default saga;
