import { all, put, takeEvery, call, select } from 'redux-saga/effects';
import get from 'lodash/get';
import concat from 'lodash/concat';

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
import DocAssociationsConverter from '../dto/docAssociations';
import { DIRECTIONS } from '../constants/docAssociations';

const allowedConnectionsDirectionByKey = (state, recordRef) => {
  return get(state, ['docAssociations', recordRef, 'allowedConnections'], []).reduce(
    (res, cur) => ({ ...res, [cur.name]: cur.direction }),
    {}
  );
};

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
