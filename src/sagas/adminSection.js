import React from 'react';
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import queryString from 'query-string';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { URL } from '../constants';
import { SectionTypes } from '../constants/bpmn';
import PageService from '../services/PageService';
import { fetchGroupSectionList, initAdminSection, setActiveSection, setGroupSectionList } from '../actions/adminSection';
import AdminSectionService from '../services/AdminSectionService';

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
    console.log(sectionsGroup);
    const query = queryString.parseUrl(window.location.href).query;

    yield put(setGroupSectionList(sectionsGroup));

    if (isEmpty(query)) {
      yield put(setActiveSection(AdminSectionService.getActiveSectionInGroups(sectionsGroup, i => i.type === SectionTypes.BPM)));
    } else {
      yield put(setActiveSection(AdminSectionService.getActiveSectionInGroups(sectionsGroup, i => i.config.journalId === query.journalId)));
    }
  } catch (e) {
    logger.error('[bpmn doFetchGroupSectionList saga] error', e.message);
  }
}

function* openActiveSection({ api, logger }, action) {
  try {
    const item = cloneDeep(action.payload);
    const groupSectionList = yield select(state => state.adminSection.groupSectionList || []);
    console.log(item);
    let href = '';
    let options = { updateUrl: true, pushHistory: true };

    switch (item.type) {
      case SectionTypes.BPM: {
        href = item.href;
        break;
      }
      case SectionTypes.JOURNAL: {
        href = queryString.stringifyUrl({ url: URL.BPMN_DESIGNER, query: { journalId: get(item, 'config.journalId') } });
        break;
      }
      case SectionTypes.DEV_TOOLS: {
        href = item.href;
        //todo
        // options = { openInBackground: true };
        break;
      }
      default: {
        console.warn('Unknown section');
        return;
      }
    }

    PageService.changeUrlLink(href, options);
    //
    // if (options.openInBackground) {
    //   yield put(setActiveSection(groupSectionList.find(i => i.type === SectionTypes.BPM)));
    // }
  } catch (e) {
    logger.error('[bpmn openActiveSection saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initAdminSection().type, doInit, ea);
  yield takeLatest(fetchGroupSectionList().type, doFetchGroupSectionList, ea);
  yield takeEvery(setActiveSection().type, openActiveSection, ea);
}

export default saga;
