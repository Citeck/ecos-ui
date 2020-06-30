import { call, put, select, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import {
  createDocument,
  deleteDocument,
  editDocument,
  getDocument,
  getSettings,
  recreateDocument,
  setError,
  setLoading,
  setSettings
} from '../actions/docConstructor';
import { t } from '../helpers/util';
import PageService from '../services/PageService';
import Records from '../components/Records';

const options = { role: 'initiator', permission: 'Consumer' };

function* fetchGetSettings({ api, logger }, { payload: { stateId, record } }) {
  try {
    const settings = {};
    let docProps = {};
    const name = 'doc.one.base.url';
    const response = yield call(api.docConstructor.getSettings, { name });
    //todo wait normal json
    const data = JSON.parse(response.replace('data:', '"data":')).data;

    if (data && data[name]) {
      settings.docOneUrl = data[name] + '/document/';
      docProps = yield call(api.docConstructor.getRecordInfo, record);
      yield put(setSettings({ stateId, settings: { ...settings, ...docProps } }));
    } else {
      yield put(setError({ stateId, error: t('doc-constructor-widget.error.no-doc-one-base-url') }));
    }
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    NotificationManager.error(t('doc-constructor-widget.error.get-settings'), t('error'));
    logger.error('[docConstructor/fetchGetSettings saga] error', e.message);
  }
}

function* runCreateDocument({ api, logger }, { payload: { stateId, record, templateRef } }) {
  try {
    const data = yield select(state => state.docConstructor[stateId]);

    yield call(api.docConstructor.setContractTemplate, { record, templateRef });
    const docOneDocumentId = yield call(api.docConstructor.createDocumentDocOne, { record });
    yield call(api.docConstructor.setPermissionForRole, { record, docOneDocumentId, options });

    NotificationManager.success(t('doc-constructor-widget.success.create-doc-one-file-by-node-with-template'), t('success'));
    PageService.changeUrlLink(data.docOneUrl + docOneDocumentId, { openNewBrowserTab: true, openInBackground: true });
  } catch (e) {
    yield call(api.docConstructor.setContractTemplate, { record, templateRef: null });
    yield put(setError({ stateId, error: e.message }));
    NotificationManager.error(t('doc-constructor-widget.error.create-doc-one-file-by-node-with-template'), t('error'));
    logger.error('[docConstructor/runCreateDocument saga] error', e.message);
  } finally {
    Records.get(record).update();
  }
}

function* runRecreateDocument({ api, logger }, { payload: { stateId, record, templateRef } }) {
  try {
    yield call(api.docConstructor.deleteDocumentDocOne, { record });
    yield put(createDocument({ stateId, record, templateRef }));
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    logger.error('[docConstructor/runRecreateDocument saga] error', e.message);
  }
}

function* runEditDocument({ api, logger }, { payload: { stateId, record } }) {
  try {
    const { docOneDocumentId, docOneUrl } = yield select(state => state.docConstructor[stateId]);

    yield call(api.docConstructor.setPermissionForRole, { record, docOneDocumentId, options });
    PageService.changeUrlLink(docOneUrl + docOneDocumentId, { openNewBrowserTab: true, openInBackground: true });
    yield put(setLoading({ stateId, isLoading: false }));
    NotificationManager.success(t('doc-constructor-widget.success.edit-document'), t('success'));
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    NotificationManager.error(t('doc-constructor-widget.error.edit-document'), t('error'));
    logger.error('[docConstructor/runEditDocument saga] error', e.message);
  }
}

function* fetchGetDocument({ api, logger }, { payload: { stateId, record } }) {
  try {
    const { docOneDocumentId } = yield select(state => state.docConstructor[stateId]);
    const result = yield call(api.docConstructor.getDocumentDocOne, { record, docOneDocumentId });

    if (result === true) {
      Records.get(record).update();
    } else {
      yield put(setError({ stateId, error: t('doc-constructor-widget.error.content-not-changed') }));
    }
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    logger.error('[docConstructor/fetchGetDocument saga] error', e.message);
  }
}

function* runDeleteDocument({ api, logger }, { payload: { stateId, record } }) {
  try {
    yield call(api.docConstructor.deleteDocumentDocOne, { record });
    NotificationManager.success(t('doc-constructor-widget.success.delete-content-and-doc-one-id'), t('success'));
    Records.get(record).update();
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    NotificationManager.error(t('doc-constructor-widget.error.delete-content-and-doc-one-id'), t('error'));
    logger.error('[docConstructor/runDeleteDocument saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSettings().type, fetchGetSettings, ea);
  yield takeEvery(createDocument().type, runCreateDocument, ea);
  yield takeEvery(recreateDocument().type, runRecreateDocument, ea);
  yield takeEvery(editDocument().type, runEditDocument, ea);
  yield takeEvery(deleteDocument().type, runDeleteDocument, ea);
  yield takeEvery(getDocument().type, fetchGetDocument, ea);
}

export default saga;
