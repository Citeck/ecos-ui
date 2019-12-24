import { all, put, takeEvery, call, select } from 'redux-saga/effects';
import concat from 'lodash/concat';

import {
  getDocuments,
  getMenu,
  getSectionList,
  addDocuments,
  removeDocuments,
  setAllowedConnections,
  setDocuments,
  setMenu,
  setSectionList
} from '../actions/docAssociations';
import DocAssociationsConverter from '../dto/docAssociations';
import { DIRECTIONS } from '../constants/docAssociations';
import { selectAllowedDirectionsByKey } from '../selectors/docAssociations';

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

function* getAssociation({ api, logger }, { id, direction }, recordRef) {
  try {
    if (direction === DIRECTIONS.TARGET) {
      const data = yield call(api.docAssociations.getTargetAssociations, id, recordRef);

      return DocAssociationsConverter.getAssociationsByDirection(data, DIRECTIONS.TARGET);
    }

    if (direction === DIRECTIONS.SOURCE) {
      const data = yield call(api.docAssociations.getSourceAssociations, id, recordRef);

      return DocAssociationsConverter.getAssociationsByDirection(data, DIRECTIONS.SOURCE);
    }

    if (direction === DIRECTIONS.BOTH) {
      const target = DocAssociationsConverter.getAssociationsByDirection(
        yield call(api.docAssociations.getTargetAssociations, id, recordRef),
        DIRECTIONS.TARGET
      );
      const source = DocAssociationsConverter.getAssociationsByDirection(
        yield call(api.docAssociations.getSourceAssociations, id, recordRef),
        DIRECTIONS.SOURCE
      );

      return concat(target, source);
    }
  } catch (e) {
    logger.error('[docAssociations getAssociation saga error', e.message);
  }
}

function* sagaGetDocuments({ api, logger }, { payload }) {
  try {
    const allowedConnections = DocAssociationsConverter.getAllowedConnections(
      yield call(api.docAssociations.getAllowedConnections, payload)
    );

    yield put(setAllowedConnections({ key: payload, allowedConnections }));

    const response = yield allowedConnections.map(function*(connection) {
      const result = yield getAssociation({ api, logger }, { id: connection.name, direction: connection.direction }, payload);

      return { [connection.name]: result };
    });
    const formattedResponse = DocAssociationsConverter.getDocumentsByDirection(response);

    yield put(
      setDocuments({
        key: payload,
        documents: DocAssociationsConverter.getDocumentsForWeb(formattedResponse, allowedConnections),
        documentsTotalCount: DocAssociationsConverter.getDocumentsTotalCount(formattedResponse)
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

        item.items = journals.map(DocAssociationsConverter.getJournalForWeb);

        return item;
      })
    );

    yield put(
      setMenu({
        key: action.payload,
        menu: DocAssociationsConverter.getMenuForWeb(firstLvl, secondLvl)
      })
    );
  } catch (e) {
    logger.error('[docAssociations sagaGetMenu saga error', e.message);
  }
}

function* sagaAddDocuments({ api, logger }, { payload }) {
  try {
    const { connectionId, record, documents, journalRef } = payload;
    const directions = yield select(state => selectAllowedDirectionsByKey(state, record));
    let recordRef = record;

    if (directions[connectionId] === DIRECTIONS.SOURCE) {
      recordRef = journalRef;
    }

    yield call(api.docAssociations.addDocuments, {
      recordRef,
      documents,
      associationId: connectionId
    });
    yield put(getDocuments(record));
  } catch (e) {
    logger.error('[docAssociations sagaAddDocuments saga error', e.message);
  }
}

function* sagaRemoveDocuments({ api, logger }, { payload }) {
  try {
    const { associationId, record, documents, journalRef } = payload;
    const directions = yield select(state => selectAllowedDirectionsByKey(state, record));
    let recordRef = record;

    if (directions[associationId] === DIRECTIONS.SOURCE) {
      recordRef = journalRef;
    }

    yield call(api.docAssociations.removeDocuments, {
      recordRef,
      documents,
      associationId
    });
    yield put(getDocuments(record));
  } catch (e) {
    logger.error('[docAssociations sagaRemoveDocuments saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSectionList().type, sagaGetSectionList, ea);
  yield takeEvery(getDocuments().type, sagaGetDocuments, ea);
  yield takeEvery(getMenu().type, sagaGetMenu, ea);
  yield takeEvery(addDocuments().type, sagaAddDocuments, ea);
  yield takeEvery(removeDocuments().type, sagaRemoveDocuments, ea);
}

export default saga;
