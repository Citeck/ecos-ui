import { put, select, takeEvery, all } from 'redux-saga/effects';
import {
  getSectionList,
  setSectionList,
  getDocuments,
  setDocuments,
  setAllowedConnections,
  getMenu,
  setMenu
} from '../actions/docAssociations';
import { getDocumentsForWeb, getJournalForWeb, getMenuForWeb } from '../dto/docAssociations';

function* sagaGetSectionList({ api, logger }, action) {
  try {
    const response = yield api.docAssociations.getSectionList();

    yield put(
      setSectionList({
        key: action.payload,
        sectionList: response.records
      })
    );
  } catch (e) {
    logger.error('[comments sagaGetSectionList saga error', e.message);
  }
}

function* sagaGetDocuments({ api, logger }, action) {
  try {
    const allowedConnections = yield api.docAssociations.getAllowedConnections(action.payload);

    yield put(setAllowedConnections({ key: action.payload, allowedConnections }));

    const response = yield api.docAssociations.getDocuments(action.payload, allowedConnections.map(item => item.name));

    yield put(setDocuments({ key: action.payload, documents: getDocumentsForWeb(response, allowedConnections) }));
  } catch (e) {
    logger.error('[comments sagaGetDocuments saga error', e.message);
  }
}

function* sagaGetMenu({ api, logger }, action) {
  try {
    const firstLvl = yield api.docAssociations.getAllowedConnections(action.payload);
    let { records: secondLvl } = yield api.docAssociations.getSectionList(action.payload);

    secondLvl = yield all(
      secondLvl.map(function*(item) {
        const journals = yield api.docAssociations.getJournalList(item.name);

        item.items = journals.map(getJournalForWeb);

        return item;
      })
    );

    yield put(setMenu({ key: action.payload, menu: getMenuForWeb(firstLvl, secondLvl) }));
  } catch (e) {
    logger.error('[comments sagaGetMenu saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSectionList().type, sagaGetSectionList, ea);
  yield takeEvery(getDocuments().type, sagaGetDocuments, ea);
  yield takeEvery(getMenu().type, sagaGetMenu, ea);
}

export default saga;
