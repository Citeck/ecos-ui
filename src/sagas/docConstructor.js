import { call, put, select, takeEvery } from 'redux-saga/effects';

import {
  createDocument,
  deleteDocument,
  editDocument,
  getDocument,
  getDocumentParams,
  initConstructor,
  recreateDocument,
  setError,
  setLoading,
  setSettings
} from '../actions/docConstructor';
import Records from '../components/Records';
import { t } from '../helpers/util';
import PageService from '../services/PageService';

import { NotificationManager } from '@/services/notifications';

const KEY_URL = 'doc.one.base.url';
const POSTFIX_URL = '/document/';
const OPTIONS = { role: 'initiator', permission: 'Consumer' };

function* runInitConstructor({ api }, { payload, payload: { stateId, record, config } }) {
  try {
    const settings = {};
    const data = yield call(api.docConstructor.getSettings, { name: KEY_URL });
    const isRight = data && data[KEY_URL];

    if (isRight) {
      settings.docOneUrl = data[KEY_URL] + POSTFIX_URL;
      yield* fetchDocumentParams({ api }, { payload });
    }

    yield put(setError({ stateId, error: isRight ? '' : t('doc-constructor-widget.error.no-doc-one-base-url') }));
    yield put(setSettings({ stateId, settings }));
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    NotificationManager.error(t('doc-constructor-widget.error.get-settings'), t('error'));
    console.error('[docConstructor/runInitConstructor saga] error', e);
  }
}

function* fetchDocumentParams({ api }, { payload: { stateId, record } }) {
  try {
    const settings = yield call(api.docConstructor.getDocumentInfo, record);
    yield put(setSettings({ stateId, settings }));
  } catch (e) {
    NotificationManager.error(t('doc-constructor-widget.error.get-settings'), t('error'));
    console.error('[docConstructor/fetchDocumentParams saga] error', e);
  }
}

function* runCreateDocument({ api }, { payload: { stateId, record, templateRef } }) {
  try {
    const data = yield select(state => state.docConstructor[stateId]);

    yield call(api.docConstructor.setContractTemplate, { record, templateRef });
    const docOneDocumentId = yield call(api.docConstructor.createDocumentDocOne, { record });
    yield call(api.docConstructor.setPermissionForRole, { record, docOneDocumentId, options: OPTIONS });

    yield put(setError({ stateId }));
    NotificationManager.success(t('doc-constructor-widget.success.create-doc-one-file-by-node-with-template'), t('success'));
    PageService.changeUrlLink(data.docOneUrl + docOneDocumentId, { openNewBrowserTab: true, openInBackground: true });
  } catch (e) {
    yield call(api.docConstructor.setContractTemplate, { record, templateRef: null });
    yield put(setError({ stateId, error: e.message }));
    NotificationManager.error(t('doc-constructor-widget.error.create-doc-one-file-by-node-with-template'), t('error'));
    console.error('[docConstructor/runCreateDocument saga] error', e);
  } finally {
    yield put(setLoading({ stateId }));
    Records.get(record).update();
  }
}

function* runRecreateDocument({ api }, { payload: { stateId, record, templateRef } }) {
  try {
    yield call(api.docConstructor.deleteDocumentDocOne, { record });
    yield put(createDocument({ stateId, record, templateRef }));
    yield put(setError({ stateId }));
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    console.error('[docConstructor/runRecreateDocument saga] error', e);
  }
}

function* runEditDocument({ api }, { payload: { stateId, record } }) {
  try {
    const { docOneDocumentId, docOneUrl } = yield select(state => state.docConstructor[stateId]);

    yield call(api.docConstructor.setPermissionForRole, { record, docOneDocumentId, options: OPTIONS });
    PageService.changeUrlLink(docOneUrl + docOneDocumentId, { openNewBrowserTab: true, openInBackground: true });
    yield put(setLoading({ stateId }));
    yield put(setError({ stateId }));
    NotificationManager.success(t('doc-constructor-widget.success.edit-document'), t('success'));
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    NotificationManager.error(t('doc-constructor-widget.error.edit-document'), t('error'));
    console.error('[docConstructor/runEditDocument saga] error', e);
  }
}

function* fetchGetDocument({ api }, { payload: { stateId, record } }) {
  try {
    const { docOneDocumentId } = yield select(state => state.docConstructor[stateId]);
    const result = yield call(api.docConstructor.getDocumentDocOne, { record, docOneDocumentId });

    yield put(setError({ stateId, error: result ? '' : t('doc-constructor-widget.error.content-not-changed') }));
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    console.error('[docConstructor/fetchGetDocument saga] error', e);
  } finally {
    yield put(setLoading({ stateId }));
    Records.get(record).update();
  }
}

function* runDeleteDocument({ api }, { payload: { stateId, record } }) {
  try {
    yield call(api.docConstructor.deleteDocumentDocOne, { record });
    yield call(api.docConstructor.setContractTemplate, { record, templateRef: null });

    yield put(setError({ stateId }));
    NotificationManager.success(t('doc-constructor-widget.success.delete-content-and-doc-one-id'), t('success'));
  } catch (e) {
    yield put(setError({ stateId, error: e.message }));
    NotificationManager.error(t('doc-constructor-widget.error.delete-content-and-doc-one-id'), t('error'));
    console.error('[docConstructor/runDeleteDocument saga] error', e);
  } finally {
    yield put(setLoading({ stateId }));
    Records.get(record).update();
  }
}

function* saga(ea) {
  yield takeEvery(initConstructor().type, runInitConstructor, ea);
  yield takeEvery(createDocument().type, runCreateDocument, ea);
  yield takeEvery(recreateDocument().type, runRecreateDocument, ea);
  yield takeEvery(editDocument().type, runEditDocument, ea);
  yield takeEvery(deleteDocument().type, runDeleteDocument, ea);
  yield takeEvery(getDocument().type, fetchGetDocument, ea);
  yield takeEvery(getDocumentParams().type, fetchDocumentParams, ea);
}

export default saga;
