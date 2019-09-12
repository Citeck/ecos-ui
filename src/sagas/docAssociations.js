import { put, select, takeEvery } from 'redux-saga/effects';
import {
  getSectionList,
  setSectionList,
  getDocuments,
  setAssociatedWithDocs,
  setBaseDocs,
  setAccountingDocs
} from '../actions/docAssociations';
import { getDocumentsForWeb } from '../dto/docAssociations';

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
    const response = yield api.docAssociations.getDocuments(action.payload);
    const { associatedWithDocs, baseDocs, accountingDocs } = getDocumentsForWeb(response);

    yield put(setAssociatedWithDocs({ key: action.payload, associatedWithDocs }));
    yield put(setBaseDocs({ key: action.payload, baseDocs }));
    yield put(setAccountingDocs({ key: action.payload, accountingDocs }));
  } catch (e) {
    logger.error('[comments sagaGetDocuments saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSectionList().type, sagaGetSectionList, ea);
  yield takeEvery(getDocuments().type, sagaGetDocuments, ea);
}

export default saga;
