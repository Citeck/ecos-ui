import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import queryString from 'query-string';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { URL } from '../constants';
import { SectionTypes, SectionURL } from '../constants/adminSection';
import PageService from '../services/PageService';
import AdminSectionService from '../services/AdminSectionService';
import { fetchGroupSectionList, initAdminSection, setActiveSection, setGroupSectionList } from '../actions/adminSection';

function* doInit({ api, logger }) {
  try {
    yield put(fetchGroupSectionList());
  } catch (e) {
    logger.error('[adminSection doInit saga] error', e.message);
  }
}

function* doFetchGroupSectionList({ api, logger }, action) {
  try {
    const sectionsGroup = yield call(api.adminSection.getGroupSectionList);
    const query = queryString.parseUrl(window.location.href).query;
    const activeSection =
      (!isEmpty(query) && AdminSectionService.getActiveSectionInGroups(sectionsGroup, i => i.config.journalId === query.journalId)) ||
      AdminSectionService.getActiveSectionInGroups(sectionsGroup, i => i.type === SectionTypes.BPM);

    yield put(setGroupSectionList(sectionsGroup));
    yield put(setActiveSection(activeSection));
  } catch (e) {
    logger.error('[adminSection doFetchGroupSectionList saga] error', e.message);
  }
}

function* openActiveSection({ api, logger }, action) {
  try {
    const item = cloneDeep(action.payload);
    const sectionsGroup = yield select(state => state.adminSection.groupSectionList || []);
    let href = '';
    let options = { updateUrl: true, pushHistory: true };

    switch (item.type) {
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
        options = { openNewTab: true };
        break;
      }
      default: {
        console.warn('Unknown section');
        return;
      }
    }

    if (options.openInBackground || options.openNewTab) {
      yield put(setActiveSection(AdminSectionService.getActiveSectionInGroups(sectionsGroup, i => i.type === SectionTypes.BPM)));
    }

    PageService.changeUrlLink(href, options);
  } catch (e) {
    logger.error('[adminSection openActiveSection saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initAdminSection().type, doInit, ea);
  yield takeLatest(fetchGroupSectionList().type, doFetchGroupSectionList, ea);
  yield takeEvery(setActiveSection().type, openActiveSection, ea);
}

export default saga;
