import { all, put, takeEvery, call, select } from 'redux-saga/effects';
import concat from 'lodash/concat';

import {
  getAssociations,
  getMenu,
  getSectionList,
  addAssociations,
  removeAssociations,
  setAllowedConnections,
  setAssociations,
  setMenu,
  setSectionList,
  setError
} from '../actions/docAssociations';
import DocAssociationsConverter from '../dto/docAssociations';
import { DIRECTIONS } from '../constants/docAssociations';
import { selectAllowedDirectionsByKey, selectAssocByAssocName, selectAssociationColumnsConfig } from '../selectors/docAssociations';

function* sagaGetSectionList({ api, logger }, { payload }) {
  try {
    const response = yield api.docAssociations.getSectionList();

    yield put(
      setSectionList({
        key: payload,
        sectionList: response.records
      })
    );
  } catch (e) {
    logger.error('[docAssociations sagaGetSectionList saga error', e.message);
  }
}

function* getAssociation({ api, logger }, { id, direction }, recordRef) {
  try {
    const attributes = DocAssociationsConverter.getColumnsAttributes(
      yield select(state => selectAssociationColumnsConfig(state, recordRef, id))
    );

    if (direction === DIRECTIONS.TARGET) {
      const data = yield call(api.docAssociations.getTargetAssociations, id, recordRef, attributes);

      return DocAssociationsConverter.getAssociationsWithDirection(data, DIRECTIONS.TARGET);
    }

    if (direction === DIRECTIONS.SOURCE) {
      const data = yield call(api.docAssociations.getSourceAssociations, id, recordRef, attributes);

      return DocAssociationsConverter.getAssociationsWithDirection(data, DIRECTIONS.SOURCE);
    }

    if (direction === DIRECTIONS.BOTH) {
      const target = DocAssociationsConverter.getAssociationsWithDirection(
        yield call(api.docAssociations.getTargetAssociations, id, recordRef, attributes),
        DIRECTIONS.TARGET
      );
      const source = DocAssociationsConverter.getAssociationsWithDirection(
        yield call(api.docAssociations.getSourceAssociations, id, recordRef, attributes),
        DIRECTIONS.SOURCE
      );

      return concat(target, source);
    }
  } catch (e) {
    logger.error('[docAssociations getAssociation saga error', e.message);
  }
}

function* sagaGetAssociations({ api, logger }, { payload }) {
  try {
    const allowedAssociations = DocAssociationsConverter.getAllowedAssociations(
      yield call(api.docAssociations.getAllowedAssociations, payload)
    );

    yield put(setAllowedConnections({ key: payload, allowedAssociations }));

    const response = yield allowedAssociations.map(function*(connection) {
      const result = yield getAssociation(
        { api, logger },
        { id: connection.attribute || connection.name, direction: connection.direction },
        payload
      );

      return { [connection.name]: result };
    });
    const formattedResponse = DocAssociationsConverter.getAssociationsByDirection(response);

    yield put(
      setAssociations({
        key: payload,
        associations: DocAssociationsConverter.getAssociationsForWeb(formattedResponse, allowedAssociations),
        associationsTotalCount: DocAssociationsConverter.getAssociationsTotalCount(formattedResponse)
      })
    );
  } catch (e) {
    yield put(setError({ key: payload }));
    logger.error('[docAssociations sagaGetAssociations saga error', e.message);
  }
}

function* sagaGetMenu({ api, logger }, { payload }) {
  try {
    const firstLvl = yield call(api.docAssociations.getAllowedAssociations, payload);
    let { records: secondLvl } = yield call(api.docAssociations.getSectionList, payload);

    secondLvl = yield all(
      secondLvl.map(function*(item) {
        const journals = yield call(api.docAssociations.getJournalList, item.name);

        item.items = journals.map(DocAssociationsConverter.getJournalForWeb);

        return item;
      })
    );

    yield put(
      setMenu({
        key: payload,
        menu: DocAssociationsConverter.getMenuForWeb(firstLvl, secondLvl)
      })
    );
  } catch (e) {
    yield put(setError({ key: payload }));
    logger.error('[docAssociations sagaGetMenu saga error', e.message);
  }
}

function* sagaAddAssociations({ api, logger }, { payload }) {
  try {
    const { associationId, record, associations } = payload;
    const directions = yield select(state => selectAllowedDirectionsByKey(state, record));
    const association = yield select(state => selectAssocByAssocName(state, record, associationId));
    const direction = association.attribute ? association.direction : directions[associationId];

    if (direction === DIRECTIONS.SOURCE) {
      yield associations.map(function*(recordRef) {
        return yield call(api.docAssociations.addAssociations, {
          recordRef,
          associations: [record],
          associationId: association.attribute || associationId,
          isSource: true
        });
      });
    } else {
      yield call(api.docAssociations.addAssociations, {
        recordRef: record,
        associations,
        associationId: association.attribute || associationId
      });
    }

    yield put(getAssociations(record));
  } catch (e) {
    yield put(setError({ key: payload.record }));
    logger.error('[docAssociations sagaAddAssociations saga error', e.message);
  }
}

function* sagaRemoveAssociations({ api, logger }, { payload }) {
  try {
    const { associationId, record, associationRef } = payload;
    const directions = yield select(state => selectAllowedDirectionsByKey(state, record));
    let recordRef = record;
    let association = associationRef;
    const { attribute } = yield select(state => selectAssocByAssocName(state, record, associationId));

    if (directions[associationId] === DIRECTIONS.SOURCE) {
      recordRef = associationRef;
      association = record;
    }

    yield call(api.docAssociations.removeAssociations, {
      recordRef,
      association,
      associationId: attribute || associationId
    });
    yield put(getAssociations(record));
  } catch (e) {
    yield put(setError({ key: payload.record }));
    logger.error('[docAssociations sagaRemoveAssociations saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSectionList().type, sagaGetSectionList, ea);
  yield takeEvery(getAssociations().type, sagaGetAssociations, ea);
  yield takeEvery(getMenu().type, sagaGetMenu, ea);
  yield takeEvery(addAssociations().type, sagaAddAssociations, ea);
  yield takeEvery(removeAssociations().type, sagaRemoveAssociations, ea);
}

export default saga;
