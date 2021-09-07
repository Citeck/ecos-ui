import { call, put, select, takeEvery } from 'redux-saga/effects';
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
import {
  selectAllowedDirectionsByKey,
  selectAssocByAssocName,
  selectAssociationColumnsConfig,
  selectAssociationsByKey
} from '../selectors/docAssociations';
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
    logger.error('[docAssociations sagaGetSectionList saga error', e);
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
    logger.error('[docAssociations getAssociation saga error', e);
  }
}

function* sagaGetAssociations({ api, logger }, { payload }) {
  try {
    const associations = yield call(api.docAssociations.getAllowedAssociations, payload);
    const configuredAssociations = yield associations.map(function*(item) {
      return yield call(api.docAssociations.getColumnConfiguration, item);
    });
    const allowedAssociations = DocAssociationsConverter.getAllowedAssociations(configuredAssociations);

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
    logger.error('[docAssociations sagaGetAssociations saga error', e);
  }
}

function* sagaGetMenu({ api, logger }, { payload }) {
  try {
    const allowedAssociations = yield call(api.docAssociations.getAllowedAssociations, payload);

    yield put(
      setMenu({
        key: payload,
        menu: DocAssociationsConverter.getMenuForWeb(allowedAssociations)
      })
    );
  } catch (e) {
    yield put(setError({ key: payload }));
    logger.error('[docAssociations sagaGetMenu saga error', e);
  }
}

function* sagaAddAssociations({ api, logger }, { payload }) {
  try {
    const { associationId, record, associations } = payload;
    const directions = yield select(state => selectAllowedDirectionsByKey(state, record));
    const association = yield select(state => selectAssocByAssocName(state, record, associationId));
    const direction = association.attribute ? association.direction : directions[associationId];
    const ownAssociations = yield select(state => selectAssociationsByKey(state, record, associationId));
    const newAssociations = direction === DIRECTIONS.SOURCE ? [record] : associations;

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

    if (!newAssociations.every(item => ownAssociations.includes(item))) {
      yield put(setError({ key: payload.record }));
    }

    Records.get([record, ...associations]).forEach(r => r && r.update());

    NotificationManager.success(
      associations.length > 1
        ? t('doc-associations-widget.add-association-many.success.message')
        : t('doc-associations-widget.add-association-one.success.message')
    );
  } catch (e) {
    const message = !e.message.includes('type is incorrect')
      ? t('doc-associations-widget.add-association.error.message')
      : t('doc-associations-widget.incorrect-type.error.message');

    NotificationManager.error(message);
    yield put(setError({ key: payload.record }));
    logger.error('[docAssociations sagaAddAssociations saga error', e);
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

    Records.get([record, associationRef]).forEach(r => r && r.update());

    NotificationManager.success(t('doc-associations-widget.remove-association.success.message'));
  } catch (e) {
    yield put(setError({ key: payload.record }));

    NotificationManager.error(t('doc-associations-widget.incorrect-type.error.message'));
    logger.error('[docAssociations sagaRemoveAssociations saga error', e);
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
    logger.error('[docAssociations sagaViewAssociation saga error', e);
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
