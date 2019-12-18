import { all, put, takeEvery, call } from 'redux-saga/effects';

import {
  getDocuments,
  getMenu,
  getSectionList,
  saveDocuments,
  setAllowedConnections,
  setDocuments,
  setMenu,
  setSectionList
} from '../actions/docAssociations';
import { getDocumentsForWeb, getDocumentsTotalCount, getJournalForWeb, getMenuForWeb } from '../dto/docAssociations';
import { DIRECTIONS } from '../constants/docAssociations';

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
    logger.error('[docAssociations sagaGetSectionList saga error', e.message);
  }
}

function* getAssociation({ id, direction }, api, recordRef) {
  try {
    if (direction === DIRECTIONS.TARGET) {
      return yield call(api.docAssociations.getAssociation, {
        settings: `${id}[]?assoc`,
        recordRef
      });
    }

    if (direction === DIRECTIONS.SOURCE) {
      return yield call(api.docAssociations.getAssociation, {
        settings: `assoc_src_${id}[]?assoc`,
        recordRef
      });
    }

    if (direction === DIRECTIONS.BOTH) {
      const target = yield call(api.docAssociations.getAssociation, {
        settings: `${id}[]?assoc`,
        recordRef
      });
      const source = yield call(api.docAssociations.getAssociation, {
        settings: `assoc_src_${id}[]?assoc`,
        recordRef
      });

      return target.concat(source);
    }
  } catch (e) {
    logger.error('[docAssociations getAssociation saga error', e.message);
  }
}

function* sagaGetDocuments({ api, logger }, { payload }) {
  try {
    const allowedConnections = yield call(api.docAssociations.getAllowedConnections, payload);

    console.warn('allowedConnections => ', allowedConnections);

    yield put(setAllowedConnections({ key: payload, allowedConnections }));

    const response = yield call(api.docAssociations.getDocuments, payload, allowedConnections.map(item => item.name));

    yield put(
      setDocuments({
        key: payload,
        documents: getDocumentsForWeb(response, allowedConnections),
        documentsTotalCount: getDocumentsTotalCount(response)
      })
    );
  } catch (e) {
    logger.error('[docAssociations sagaGetDocuments saga error', e.message);
  }
}

function* sagaGetMenu({ api, logger }, action) {
  try {
    const firstLvl = yield call(api.docAssociations.getAllowedConnections, action.payload);
    let { records: secondLvl } = yield call(api.docAssociations.getSectionList, action.payload);

    secondLvl = yield all(
      secondLvl.map(function*(item) {
        const journals = yield call(api.docAssociations.getJournalList, item.name);

        item.items = journals.map(getJournalForWeb);

        return item;
      })
    );

    yield put(setMenu({ key: action.payload, menu: getMenuForWeb(firstLvl, secondLvl) }));
  } catch (e) {
    logger.error('[docAssociations sagaGetMenu saga error', e.message);
  }
}

function* sagaSaveDocuments({ api, logger }, action) {
  try {
    const { connectionId, record, documents } = action.payload;

    yield call(api.docAssociations.saveDocuments, { connectionId, recordRef: record, documents });
    yield put(getDocuments(record));
  } catch (e) {
    logger.error('[docAssociations sagaSaveDocuments saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSectionList().type, sagaGetSectionList, ea);
  yield takeEvery(getDocuments().type, sagaGetDocuments, ea);
  yield takeEvery(getMenu().type, sagaGetMenu, ea);
  yield takeEvery(saveDocuments().type, sagaSaveDocuments, ea);
}

export default saga;
