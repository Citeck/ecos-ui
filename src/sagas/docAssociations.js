import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import concat from 'lodash/concat';
import { NotificationManager } from 'react-notifications';

import {
  addAssociations,
  getAssociations,
  getMenu,
  getSectionList,
  removeAssociations,
  setAllowedConnections,
  setAssociations,
  setError,
  setMenu,
  setSectionList,
  viewAssociation
} from '../actions/docAssociations';
import { selectAllowedDirectionsByKey, selectAssocByAssocName, selectAssociationColumnsConfig } from '../selectors/docAssociations';
import DocAssociationsConverter from '../dto/docAssociations';
import { t } from '../helpers/util';
import { DIRECTIONS } from '../constants/docAssociations';
import Records from '../components/Records';
import { ActionTypes } from '../components/Records/actions';

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

    yield put(
      setMenu({
        key: payload,
        menu: DocAssociationsConverter.getMenuForWeb(firstLvl)
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
          associationId: association.attribute || associationId
        });
      });
    } else {
      yield call(api.docAssociations.addAssociations, {
        recordRef: record,
        associations,
        associationId: association.attribute || associationId
      });
    }

    yield Records.get([record, ...associations]).forEach(r => r && r.update());

    NotificationManager.success(
      associations.length > 1
        ? t('doc-associations-widget.add-association-many.success.message')
        : t('doc-associations-widget.add-association-one.success.message')
    );
  } catch (e) {
    let message = t('doc-associations-widget.add-association.error.message');

    yield put(setError({ key: payload.record }));
    if (e.message.includes('type is incorrect')) {
      message = t('doc-associations-widget.incorrect-type.error.message');
    }

    NotificationManager.error(message);
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

    yield Records.get([record, associationRef]).forEach(r => r && r.update());

    NotificationManager.success(t('doc-associations-widget.remove-association.success.message'));
  } catch (e) {
    yield put(setError({ key: payload.record }));

    NotificationManager.error(t('doc-associations-widget.incorrect-type.error.message'));
    logger.error('[docAssociations sagaRemoveAssociations saga error', e.message);
  }
}

function* sagaViewAssociation({ api, logger }, { payload }) {
  try {
    yield call(api.recordActions.executeAction, {
      records: payload,
      action: { type: ActionTypes.VIEW }
    });
  } catch (e) {
    NotificationManager.error(t('doc-associations-widget.view-association.error.message'), t('error'));
    logger.error('[docAssociations sagaGetSectionList saga error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSectionList().type, sagaGetSectionList, ea);
  yield takeEvery(getAssociations().type, sagaGetAssociations, ea);
  yield takeEvery(getMenu().type, sagaGetMenu, ea);
  yield takeEvery(addAssociations().type, sagaAddAssociations, ea);
  yield takeEvery(removeAssociations().type, sagaRemoveAssociations, ea);
  yield takeEvery(viewAssociation().type, sagaViewAssociation, ea);
}

export default saga;
