import { all, put, takeEvery, call, select } from 'redux-saga/effects';
import get from 'lodash/get';

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

      return DocAssociationsConverter.getAssociationsByDirection(data, direction);
    }

    if (direction === DIRECTIONS.SOURCE) {
      const data = yield call(api.docAssociations.getSourceAssociations, id, recordRef);

      return DocAssociationsConverter.getAssociationsByDirection(data, direction);
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

      return target.concat(source);
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

    const response = yield call(api.docAssociations.getDocuments, payload, allowedConnections.map(item => item.name));

    const connectionsByKey = yield select(state => allowedConnectionsDirectionByKey(state, payload));

    console.log(connectionsByKey, response, allowedConnections);

    const newDocs = yield allowedConnections.map(function*(connection) {
      return yield getAssociation({ api, logger }, { id: connection.name, direction: connection.direction }, payload);
    });

    console.warn(DocAssociationsConverter.getDocumentsForWeb(response, allowedConnections), newDocs);

    yield put(
      setDocuments({
        key: payload,
        documents: DocAssociationsConverter.getDocumentsForWeb(response, allowedConnections),
        documentsTotalCount: DocAssociationsConverter.getDocumentsTotalCount(response)
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
